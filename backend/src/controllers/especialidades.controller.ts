import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { especialidadNombreSchema, normalizar } from '../lib/validaciones';

const espSchema = z.object({ nombre: especialidadNombreSchema });

// Busca una especialidad con el mismo nombre ignorando acentos y mayúsculas
// ("Cardiología" y "cardiologia" son la misma). El catálogo es chico, así que
// comparar en memoria es más barato y más preciso que depender de la collation.
async function nombreYaUsado(nombre: string, exceptoId?: string): Promise<boolean> {
  const existentes = await prisma.especialidad.findMany({ select: { id: true, nombre: true } });
  const buscado = normalizar(nombre);
  return existentes.some(e => e.id !== exceptoId && normalizar(e.nombre) === buscado);
}

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

  if (await nombreYaUsado(result.data.nombre)) {
    throw new HttpError(409, 'Ya existe esa especialidad');
  }

  const esp = await prisma.especialidad.create({ data: result.data });
  return res.status(201).json(esp);
};

// Admin: actualizar especialidad
export const actualizarEspecialidad = async (req: Request, res: Response) => {
  const result = espSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  const { id } = req.params;
  const existente = await prisma.especialidad.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Especialidad no encontrada');

  if (await nombreYaUsado(result.data.nombre, id)) {
    throw new HttpError(409, 'Ya existe esa especialidad');
  }

  const esp = await prisma.especialidad.update({ where: { id }, data: result.data });
  return res.json(esp);
};

// Admin: eliminar especialidad (solo si no tiene médicos asignados)
export const eliminarEspecialidad = async (req: Request, res: Response) => {
  const { id } = req.params;

  const existente = await prisma.especialidad.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Especialidad no encontrada');

  const medicosCount = await prisma.medico.count({ where: { especialidadId: id } });
  if (medicosCount > 0) {
    throw new HttpError(409, 'Hay médicos asignados a esta especialidad. Reasignálos primero.');
  }

  await prisma.especialidad.delete({ where: { id } });
  return res.json({ message: 'Especialidad eliminada' });
};
