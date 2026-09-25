import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';


export type AppRole = 'PATIENT' | 'ADMIN' | 'MEDICO';

export interface JwtPayload {
  userId: string;
  role: AppRole;
  email: string;
}


declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}


export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;


  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }


  const token = authHeader.split(' ')[1];

  let decoded: JwtPayload & { purpose?: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { purpose?: string };
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Los tokens "challenge" del 2do paso de login (2FA) llevan `purpose` y
  // NO sirven para autenticarse en rutas normales: solo en /auth/2fa/login.
  if (decoded.purpose) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // El token vive 7 días, así que no alcanza con su firma: hay que confirmar contra
  // la base que la cuenta sigue habilitada y con qué rol. Si no, dar de baja a alguien
  // (o bajarle el rol) no tendría efecto hasta que su token venciera.
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, activo: true, email: true },
    });

    if (!user) return res.status(401).json({ error: 'Token inválido o expirado' });
    // 401 (no 403) a propósito: el interceptor del front limpia el token y manda al
    // login, donde ya se muestra el mensaje de cuenta deshabilitada. Un 403 lo dejaría
    // "logueado" recibiendo errores en cada pantalla.
    if (!user.activo) {
      return res.status(401).json({ error: 'Tu cuenta fue dada de baja. Contactá al administrador.' });
    }

    // El rol se toma de la base, no del token: un cambio de rol aplica al instante
    req.user = { userId: user.id, role: user.role as AppRole, email: user.email };

    next();
  } catch (err) {
    return next(err);
  }
};


export const requireRole = (...roles: AppRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }


    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
    }

    next();
  };
};


export const requireAdmin = requireRole('ADMIN');
export const requirePatient = requireRole('PATIENT', 'ADMIN');
export const requireMedico = requireRole('MEDICO');
export const requireMedicoOrAdmin = requireRole('MEDICO', 'ADMIN');
