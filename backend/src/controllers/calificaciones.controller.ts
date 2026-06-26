import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { notify } from '../services/notifications.service';

const calificacionSchema = z.object({
  turnoId:    z.string().uuid(),
  estrellas:  z.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional(),
});

// Paciente: calificar un turno completado propio (estrellas + comentario).
export const crearCalificacion = async (req: Request, res: Response) => {
  const result = calificacionSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }
  const { turnoId, estrellas, comentario } = result.data;
  const pacienteId = req.user!.userId;

  // El paciente debe tener habilitado el permiso de calificar
  const usuario = await prisma.user.findUnique({
    where: { id: pacienteId },
    select: { puedeCalificar: true },
  });
  if (!usuario?.puedeCalificar) {
    throw new HttpError(403, 'No tenés habilitado calificar turnos. Consultá con administración.');
  }

  const turno = await prisma.turno.findUnique({
    where: { id: turnoId },
    include: { calificacion: true },
  });
  if (!turno || turno.pacienteId !== pacienteId) {
    throw new HttpError(404, 'Turno no encontrado');
  }
  if (turno.status !== 'COMPLETADO') {
    throw new HttpError(400, 'Solo se pueden calificar turnos completados');
  }
  if (turno.calificacion) {
    throw new HttpError(409, 'Este turno ya fue calificado');
  }

  const calificacion = await prisma.calificacion.create({
    data: {
      turnoId,
      pacienteId,
      medicoId: turno.medicoId,
      estrellas,
      ...(comentario ? { comentario } : {}),
    },
  });

  // Avisar al médico (si tiene cuenta) que recibió una calificación
  const medicoFicha = await prisma.medico.findUnique({
    where: { id: turno.medicoId },
    select: { userId: true },
  });
  if (medicoFicha?.userId) {
    await notify(
      medicoFicha.userId,
      'TURNO_COMPLETADO',
      'Nueva calificación',
      `Un paciente calificó tu atención con ${estrellas} ${estrellas === 1 ? 'estrella' : 'estrellas'}.`,
      { link: '/medico/perfil', data: { turnoId } },
    );
  }

  return res.status(201).json(calificacion);
};

// Admin: todas las calificaciones + promedio de estrellas por médico.
export const getCalificaciones = async (_req: Request, res: Response) => {
  const calificaciones = await prisma.calificacion.findMany({
    include: {
      paciente: { select: { id: true, nombre: true, apellido: true, dni: true } },
      medico: { select: { id: true, nombre: true, apellido: true, especialidad: { select: { nombre: true } } } },
      turno: { select: { id: true, fecha: true, hora: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Promedio y cantidad por médico (Prisma groupBy con avg)
  const grupos = await prisma.calificacion.groupBy({
    by: ['medicoId'],
    _avg: { estrellas: true },
    _count: { _all: true },
  });

  const medicos = await prisma.medico.findMany({
    where: { id: { in: grupos.map(g => g.medicoId) } },
    select: { id: true, nombre: true, apellido: true, especialidad: { select: { nombre: true } } },
  });
  const medicoById = new Map(medicos.map(m => [m.id, m]));

  const promediosPorMedico = grupos
    .map(g => {
      const m = medicoById.get(g.medicoId);
      return {
        medicoId: g.medicoId,
        nombre: m ? `Dr. ${m.apellido}, ${m.nombre}` : 'Médico',
        especialidad: m?.especialidad.nombre ?? '',
        promedio: Math.round((g._avg.estrellas ?? 0) * 10) / 10,
        cantidad: g._count._all,
      };
    })
    .sort((a, b) => b.promedio - a.promedio);

  return res.json({ calificaciones, promediosPorMedico });
};

// Médico: calificaciones que recibió (para su perfil).
export const getMisCalificaciones = async (req: Request, res: Response) => {
  const medico = await prisma.medico.findUnique({ where: { userId: req.user!.userId } });
  if (!medico) throw new HttpError(403, 'Tu cuenta no está vinculada a una ficha de médico');

  const [calificaciones, agg] = await Promise.all([
    prisma.calificacion.findMany({
      where: { medicoId: medico.id },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        turno: { select: { id: true, fecha: true, hora: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.calificacion.aggregate({
      where: { medicoId: medico.id },
      _avg: { estrellas: true },
      _count: { _all: true },
    }),
  ]);

  return res.json({
    calificaciones,
    promedio: Math.round((agg._avg.estrellas ?? 0) * 10) / 10,
    cantidad: agg._count._all,
  });
};
