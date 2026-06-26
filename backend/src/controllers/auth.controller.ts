import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { createToken, consumeToken } from '../lib/tokens';
import { sendMail, verifyEmailTemplate, resetPasswordTemplate } from '../lib/mailer';
import { WEB_URL } from '../config/env';

// Datos públicos del usuario que mandamos al front (nunca password ni el secreto 2FA)
const USER_PUBLIC = {
  id: true, email: true, nombre: true, apellido: true,
  dni: true, telefono: true, role: true,
  emailVerified: true, twoFactorEnabled: true,
} as const;

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  nombre:   z.string().min(2),
  apellido: z.string().min(2),
  dni:      z.string().min(7).max(11),
  telefono: z.string().optional(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const generateToken = (userId: string, role: string, email: string) =>
  jwt.sign(
    { userId, role, email },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );

// Token corto que SOLO sirve para completar el 2do paso del login (2FA).
// Lleva `purpose` para que el middleware verifyToken lo rechace en rutas normales.
const generateChallengeToken = (userId: string) =>
  jwt.sign({ userId, purpose: '2fa-challenge' }, process.env.JWT_SECRET!, { expiresIn: '5m' });

// Dispara (sin esperar) el email de verificación de cuenta
async function enviarVerificacion(user: { id: string; email: string; nombre: string }) {
  const raw = await createToken(user.id, 'EMAIL_VERIFY', 24 * 60); // 24 h
  const link = `${WEB_URL}/verify-email?token=${raw}`;
  const { subject, html, text } = verifyEmailTemplate(user.nombre, link);
  await sendMail({ to: user.email, subject, html, text });
}

export const register = async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const { email, password, nombre, apellido, dni, telefono } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, nombre, apellido, dni, telefono },
    select: USER_PUBLIC,
  });

  // Mandamos el email de verificación (no bloquea el registro si el SMTP falla)
  await enviarVerificacion(user);

  const token = generateToken(user.id, user.role, user.email);
  return res.status(201).json({ user, token });
};

export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  if (!user.activo) {
    throw new HttpError(403, 'Tu cuenta está desactivada. Contactá al administrador.');
  }

  // Si tiene 2FA activo, no entregamos el token todavía: pedimos el código (2do paso)
  if (user.twoFactorEnabled) {
    return res.json({ twoFactorRequired: true, challenge: generateChallengeToken(user.id) });
  }

  const token = generateToken(user.id, user.role, user.email);
  const { password: _p, twoFactorSecret: _s, ...userSafe } = user;
  return res.json({ user: userSafe, token });
};

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: USER_PUBLIC,
  });

  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json(user);
};

const perfilSchema = z.object({
  nombre:   z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  telefono: z.string().optional(),
});

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNueva:  z.string().min(6),
});

export const actualizarPerfil = async (req: Request, res: Response) => {
  const result = perfilSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: result.data,
    select: USER_PUBLIC,
  });

  return res.json(user);
};

export const cambiarPassword = async (req: Request, res: Response) => {
  const result = cambiarPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const { passwordActual, passwordNueva } = result.data;

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const valid = await bcrypt.compare(passwordActual, user.password);
  if (!valid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

  const hashed = await bcrypt.hash(passwordNueva, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return res.json({ message: 'Contraseña actualizada correctamente' });
};

// ────────────────────────────────────────────────────────────────
// Verificación de email
// ────────────────────────────────────────────────────────────────

const verifyEmailSchema = z.object({ token: z.string().min(10) });

export const verifyEmail = async (req: Request, res: Response) => {
  const result = verifyEmailSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const userId = await consumeToken(result.data.token, 'EMAIL_VERIFY');
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });

  return res.json({ message: 'Email verificado correctamente' });
};

export const resendVerification = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, nombre: true, emailVerified: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (user.emailVerified) {
    return res.json({ message: 'Tu email ya está verificado' });
  }

  await enviarVerificacion(user);
  return res.json({ message: 'Te reenviamos el email de verificación' });
};

// ────────────────────────────────────────────────────────────────
// Recuperación de contraseña
// ────────────────────────────────────────────────────────────────

const forgotSchema = z.object({ email: z.string().email() });

export const forgotPassword = async (req: Request, res: Response) => {
  const result = forgotSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const user = await prisma.user.findUnique({ where: { email: result.data.email } });

  // Solo enviamos si la cuenta existe, pero SIEMPRE respondemos igual
  // (no revelamos si un email está registrado o no).
  if (user && user.activo) {
    const raw = await createToken(user.id, 'PASSWORD_RESET', 60); // 1 h
    const link = `${WEB_URL}/reset-password?token=${raw}`;
    const { subject, html, text } = resetPasswordTemplate(user.nombre, link);
    await sendMail({ to: user.email, subject, html, text });
  }

  return res.json({ message: 'Si el email está registrado, te enviamos un enlace para restablecer la contraseña.' });
};

const resetSchema = z.object({
  token:    z.string().min(10),
  password: z.string().min(6),
});

export const resetPassword = async (req: Request, res: Response) => {
  const result = resetSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const userId = await consumeToken(result.data.token, 'PASSWORD_RESET');
  const hashed = await bcrypt.hash(result.data.password, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return res.json({ message: 'Contraseña restablecida. Ya podés iniciar sesión.' });
};

// ────────────────────────────────────────────────────────────────
// 2FA (TOTP — app autenticadora)
// ────────────────────────────────────────────────────────────────

const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos') });

// Genera (o regenera) el secreto y devuelve el QR para escanear. Aún NO activa el 2FA.
export const twoFactorSetup = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, twoFactorEnabled: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.twoFactorEnabled) {
    throw new HttpError(400, 'El 2FA ya está activado. Desactivalo primero si querés regenerarlo.');
  }

  const secret = authenticator.generateSecret();
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });

  const otpauthUrl = authenticator.keyuri(user.email, 'Hospital', secret);
  const qr = await QRCode.toDataURL(otpauthUrl);

  return res.json({ secret, otpauthUrl, qr });
};

// Confirma el primer código para activar el 2FA
export const twoFactorEnable = async (req: Request, res: Response) => {
  const result = codeSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.twoFactorEnabled) return res.json({ message: 'El 2FA ya estaba activado' });
  if (!user.twoFactorSecret) {
    throw new HttpError(400, 'Primero generá el código QR (setup) antes de activar el 2FA.');
  }

  const ok = authenticator.verify({ token: result.data.code, secret: user.twoFactorSecret });
  if (!ok) throw new HttpError(400, 'El código no es válido. Probá con el código actual de tu app.');

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  return res.json({ message: 'Verificación en dos pasos activada' });
};

// Desactiva el 2FA (pide un código válido para confirmar identidad)
export const twoFactorDisable = async (req: Request, res: Response) => {
  const result = codeSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return res.json({ message: 'El 2FA no estaba activado' });
  }

  const ok = authenticator.verify({ token: result.data.code, secret: user.twoFactorSecret });
  if (!ok) throw new HttpError(400, 'El código no es válido.');

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  return res.json({ message: 'Verificación en dos pasos desactivada' });
};

const twoFactorLoginSchema = z.object({
  challenge: z.string().min(10),
  code:      z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
});

// 2do paso del login: valida el challenge + el código TOTP y entrega el token real
export const twoFactorLogin = async (req: Request, res: Response) => {
  const result = twoFactorLoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  let payload: { userId: string; purpose?: string };
  try {
    payload = jwt.verify(result.data.challenge, process.env.JWT_SECRET!) as any;
  } catch {
    throw new HttpError(401, 'La sesión de verificación expiró. Volvé a iniciar sesión.');
  }
  if (payload.purpose !== '2fa-challenge') {
    throw new HttpError(401, 'Token de verificación inválido.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new HttpError(401, 'No se pudo verificar la cuenta.');
  }
  if (!user.activo) {
    throw new HttpError(403, 'Tu cuenta está desactivada. Contactá al administrador.');
  }

  const ok = authenticator.verify({ token: result.data.code, secret: user.twoFactorSecret });
  if (!ok) throw new HttpError(401, 'El código no es válido. Probá con el código actual de tu app.');

  const token = generateToken(user.id, user.role, user.email);
  const { password: _p, twoFactorSecret: _s, ...userSafe } = user;
  return res.json({ user: userSafe, token });
};
