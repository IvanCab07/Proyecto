import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';

// Campos que devolvemos de un usuario (nunca la contraseña)
const USER_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  dni: true,
  telefono: true,
  role: true,
  activo: true,
  createdAt: true,
  medico: { select: { id: true, matricula: true, especialidad: { select: { id: true, nombre: true } } } },
} as const;

// ── Admin: listado de pacientes (se mantiene para Pacientes/Historial) ──
export const getPacientes = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    select: {
      id: true, nombre: true, apellido: true,
      email: true, dni: true, telefono: true, createdAt: true,
    },
    orderBy: { apellido: 'asc' },
  });
  return res.json(users);
};

// ── Admin: historial completo de un paciente (turnos, recetas y estudios) ──
export const getHistorialPaciente = async (req: Request, res: Response) => {
  const { id } = req.params;

  const [user, turnos, recetas, estudios] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, nombre: true, apellido: true, dni: true, email: true, telefono: true, createdAt: true },
    }),
    prisma.turno.findMany({
      where: { pacienteId: id },
      include: { medico: { include: { especialidad: true } } },
      orderBy: { fecha: 'desc' },
    }),
    prisma.receta.findMany({
      where: { pacienteId: id },
      include: { medico: { include: { especialidad: true } } },
      orderBy: { fechaEmision: 'desc' },
    }),
    prisma.estudio.findMany({
      where: { pacienteId: id },
      orderBy: { fecha: 'desc' },
    }),
  ]);

  if (!user) return res.status(404).json({ error: 'Paciente no encontrado' });
  return res.json({ user, turnos, recetas, estudios });
};

// ── Admin: listar TODAS las cuentas (con filtro opcional por rol) ──
export const getUsuarios = async (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;
  const where = role && ['PATIENT', 'ADMIN', 'MEDICO'].includes(role) ? { role: role as any } : {};

  const users = await prisma.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
  });
  return res.json(users);
};

const crearUsuarioSchema = z.object({
  email:          z.string().email(),
  password:       z.string().min(6),
  nombre:         z.string().min(2),
  apellido:       z.string().min(2),
  dni:            z.string().min(7).max(11),
  telefono:       z.string().optional(),
  role:           z.enum(['PATIENT', 'ADMIN', 'MEDICO']).default('PATIENT'),
  matricula:      z.string().min(4).optional(),
  especialidadId: z.string().uuid().optional(),
}).refine((d) => d.role !== 'MEDICO' || (!!d.matricula && !!d.especialidadId), {
  message: 'Un médico necesita matrícula y especialidad',
  path: ['matricula'],
});

// ── Admin: crear una cuenta con cualquier rol ──
export const crearUsuario = async (req: Request, res: Response) => {
  const result = crearUsuarioSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  const { email, password, nombre, apellido, dni, telefono, role, matricula, especialidadId } = result.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  // Médico: crea el usuario y su ficha vinculada en una sola transacción
  if (role === 'MEDICO') {
    const esp = await prisma.especialidad.findUnique({ where: { id: especialidadId! } });
    if (!esp) throw new HttpError(404, 'La especialidad seleccionada no existe');

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email, password: hashedPassword, nombre, apellido, dni, telefono, role },
      });
      await tx.medico.create({
        data: { nombre, apellido, matricula: matricula!, especialidadId: especialidadId!, userId: u.id },
      });
      return u;
    });

    const full = await prisma.user.findUnique({ where: { id: user.id }, select: USER_SELECT });
    return res.status(201).json(full);
  }

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, nombre, apellido, dni, telefono, role },
    select: USER_SELECT,
  });
  return res.status(201).json(user);
};

const actualizarUsuarioSchema = z.object({
  nombre:   z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  telefono: z.string().optional(),
  role:     z.enum(['PATIENT', 'ADMIN', 'MEDICO']).optional(),
  activo:   z.boolean().optional(),
});

// ── Admin: editar datos, rol o estado (activo) de una cuenta ──
export const actualizarUsuario = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = actualizarUsuarioSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });
  const data = result.data;

  // No permitir que el admin se bloquee a sí mismo
  if (id === req.user!.userId) {
    if (data.activo === false) throw new HttpError(400, 'No podés desactivar tu propia cuenta');
    if (data.role && data.role !== 'ADMIN') throw new HttpError(400, 'No podés quitarte el rol de administrador');
  }

  const target = await prisma.user.findUnique({ where: { id }, include: { medico: true } });
  if (!target) throw new HttpError(404, 'Usuario no encontrado');

  // Pasar a MÉDICO requiere tener una ficha vinculada (se crea desde "crear médico")
  if (data.role === 'MEDICO' && !target.medico) {
    throw new HttpError(400, 'Para convertir esta cuenta en médico, creala como médico (necesita matrícula y especialidad).');
  }

  const user = await prisma.user.update({ where: { id }, data, select: USER_SELECT });
  return res.json(user);
};

const resetPasswordSchema = z.object({ password: z.string().min(6) });

// ── Admin: resetear la contraseña de una cuenta ──
export const resetPassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, 'Usuario no encontrado');

  const hashed = await bcrypt.hash(result.data.password, 12);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
  return res.json({ message: 'Contraseña actualizada' });
};

// ── Admin: eliminar una cuenta (con protecciones) ──
export const eliminarUsuario = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === req.user!.userId) throw new HttpError(400, 'No podés eliminar tu propia cuenta');

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, 'Usuario no encontrado');

  if (target.role === 'ADMIN') {
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (admins <= 1) throw new HttpError(400, 'No podés eliminar el último administrador');
  }

  const [turnos, recetas, estudios] = await Promise.all([
    prisma.turno.count({ where: { pacienteId: id } }),
    prisma.receta.count({ where: { pacienteId: id } }),
    prisma.estudio.count({ where: { pacienteId: id } }),
  ]);
  if (turnos + recetas + estudios > 0) {
    throw new HttpError(409, 'El usuario tiene turnos, recetas o estudios. Desactivalo en vez de eliminarlo.');
  }

  await prisma.user.delete({ where: { id } });
  return res.json({ message: 'Usuario eliminado' });
};
