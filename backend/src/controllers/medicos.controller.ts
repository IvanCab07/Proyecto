import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { formatZodError } from '../lib/httpError';

const medicoSchema = z.object({
  nombre:        z.string().min(2),
  apellido:      z.string().min(2),
  matricula:     z.string().min(4),
  especialidadId: z.string().uuid(),
});

const actualizarMedicoSchema = z.object({
  nombre:     z.string().min(2).optional(),
  apellido:   z.string().min(2).optional(),
  disponible: z.boolean().optional(),
});

// Pacientes y admins: médicos disponibles
export const getMedicosDisponibles = async (_req: Request, res: Response) => {
  const medicos = await prisma.medico.findMany({
    where: { disponible: true },
    include: { especialidad: true },
    orderBy: { apellido: 'asc' },
  });
  return res.json(medicos);
};

// Pacientes y admins: médicos disponibles de una especialidad
export const getMedicosPorEspecialidad = async (req: Request, res: Response) => {
  const medicos = await prisma.medico.findMany({
    where: { especialidadId: req.params.especialidadId, disponible: true },
    include: { especialidad: true },
  });
  return res.json(medicos);
};

// Admin: todos los médicos (incluye no disponibles)
export const getAllMedicos = async (_req: Request, res: Response) => {
  const medicos = await prisma.medico.findMany({
    include: { especialidad: true },
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
  });
  return res.json(medicos);
};

// Admin: crear médico
export const crearMedico = async (req: Request, res: Response) => {
  const result = medicoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const { nombre, apellido, matricula, especialidadId } = result.data;

  const existente = await prisma.medico.findUnique({ where: { matricula } });
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un médico con esa matrícula' });
  }

  const medico = await prisma.medico.create({
    data: { nombre, apellido, matricula, especialidadId },
    include: { especialidad: true },
  });

  return res.status(201).json(medico);
};

// Admin: actualizar médico (disponibilidad o datos)
export const actualizarMedico = async (req: Request, res: Response) => {
  const result = actualizarMedicoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }
  const { nombre, apellido, disponible } = result.data;

  const medico = await prisma.medico.update({
    where: { id: req.params.id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(apellido !== undefined && { apellido }),
      ...(disponible !== undefined && { disponible }),
    },
    include: { especialidad: true },
  });

  return res.json(medico);
};

// Horarios ocupados de un médico en una fecha (para elegir turno)
export const getDisponibilidad = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ error: 'Parámetro fecha requerido (YYYY-MM-DD)' });

  const fechaStr = fecha as string;
  const inicioFecha = new Date(`${fechaStr}T00:00:00`);
  const finFecha    = new Date(`${fechaStr}T23:59:59`);
  if (isNaN(inicioFecha.getTime()) || isNaN(finFecha.getTime())) {
    return res.status(400).json({ error: 'Parámetro fecha inválido (YYYY-MM-DD)' });
  }

  const turnos = await prisma.turno.findMany({
    where: {
      medicoId: id,
      fecha: { gte: inicioFecha, lte: finFecha },
      status: { in: ['PENDIENTE', 'CONFIRMADO'] },
    },
    select: { hora: true },
  });

  // Sobreturnos en espera por hora (para mostrar "N en espera" al elegir un horario ocupado)
  const enEspera = await prisma.turno.findMany({
    where: {
      medicoId: id,
      fecha: { gte: inicioFecha, lte: finFecha },
      status: 'EN_ESPERA',
    },
    select: { hora: true },
  });

  const sobreturnos: Record<string, number> = {};
  for (const t of enEspera) {
    sobreturnos[t.hora] = (sobreturnos[t.hora] ?? 0) + 1;
  }

  return res.json({ horasOcupadas: turnos.map(t => t.hora), sobreturnos });
};

// Admin: eliminar médico (solo si no tiene turnos pendientes/confirmados)
export const eliminarMedico = async (req: Request, res: Response) => {
  const turnoActivo = await prisma.turno.findFirst({
    where: { medicoId: req.params.id, status: { in: ['PENDIENTE', 'CONFIRMADO'] } },
  });

  if (turnoActivo) {
    return res.status(409).json({ error: 'El médico tiene turnos activos. Desactivalo en vez de eliminarlo.' });
  }

  await prisma.medico.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Médico eliminado' });
};
