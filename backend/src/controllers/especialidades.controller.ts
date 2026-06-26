import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { formatZodError } from '../lib/httpError';

const espSchema = z.object({ nombre: z.string().min(3) });

// Pacientes y admins: listado de especialidades con cantidad de médicos
export const getEspecialidades = async (_req: Request, res: Response) => {
  const especialidades = await prisma.especialidad.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { medicos: true } } },
  });
  return res.json(especialidades);
};

// Admin: crear especialidad
export const crearEspecialidad = async (req: Request, res: Response) => {
  const result = espSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  const existente = await prisma.especialidad.findUnique({ where: { nombre: result.data.nombre } });
  if (existente) return res.status(409).json({ error: 'Ya existe esa especialidad' });

  const esp = await prisma.especialidad.create({ data: result.data });
  return res.status(201).json(esp);
};

// Admin: actualizar especialidad
export const actualizarEspecialidad = async (req: Request, res: Response) => {
  const result = espSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  const esp = await prisma.especialidad.update({
    where: { id: req.params.id },
    data: result.data,
  });
  return res.json(esp);
};

// Admin: eliminar especialidad (solo si no tiene médicos asignados)
export const eliminarEspecialidad = async (req: Request, res: Response) => {
  const medicosCount = await prisma.medico.count({ where: { especialidadId: req.params.id } });
  if (medicosCount > 0) {
    return res.status(409).json({ error: 'Hay médicos asignados a esta especialidad. Reasignálos primero.' });
  }
  await prisma.especialidad.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Especialidad eliminada' });
};
