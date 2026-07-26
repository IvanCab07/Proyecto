import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { fichaDelMedico } from '../lib/medicoPaciente';
import { ratingsPorMedico, redondearPromedio, SIN_RATING } from '../lib/ratings';
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
      { link: '/medico/calificaciones', data: { turnoId } },
    );
  }

  return res.status(201).json(calificacion);
};

// Admin: todas las calificaciones + promedio de estrellas por médico.
export const getCalificaciones = async (_req: Request, res: Response) => {
  const [calificaciones, medicos] = await Promise.all([
    prisma.calificacion.findMany({
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true, dni: true } },
        medico: { select: { id: true, nombre: true, apellido: true, especialidad: { select: { nombre: true } } } },
        turno: { select: { id: true, fecha: true, hora: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Se parte del listado completo de médicos (y no de la tabla de calificaciones) para que
    // los que todavía no tienen ninguna reseña también aparezcan, con 0 en vez de desaparecer.
    prisma.medico.findMany({
      select: { id: true, nombre: true, apellido: true, especialidad: { select: { nombre: true } } },
    }),
  ]);

  const ratings = await ratingsPorMedico(medicos.map(m => m.id));

  const promediosPorMedico = medicos
    .map(m => ({
      medicoId: m.id,
      nombre: `Dr. ${m.apellido}, ${m.nombre}`,
      especialidad: m.especialidad.nombre,
      ...(ratings.get(m.id) ?? SIN_RATING),
    }))
    // A igual promedio va primero el que tiene más reseñas: un 5.0 con una sola reseña
    // no debería superar a un 4.9 con cincuenta.
    .sort((a, b) => b.promedio - a.promedio || b.cantidad - a.cantidad);

  return res.json({ calificaciones, promediosPorMedico });
};

// Médico: calificaciones que recibió, con las métricas de su panel.
export const getMisCalificaciones = async (req: Request, res: Response) => {
  const medico = await fichaDelMedico(req.user!.userId);

  const [calificaciones, agg, porEstrella, atendidos] = await Promise.all([
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
    // Cuántas reseñas hay de cada puntaje, para el gráfico de distribución
    prisma.calificacion.groupBy({
      by: ['estrellas'],
      where: { medicoId: medico.id },
      _count: { _all: true },
    }),
    // Consultas efectivamente realizadas: la base sobre la que se mide la tasa de respuesta
    prisma.turno.count({ where: { medicoId: medico.id, status: 'COMPLETADO' } }),
  ]);

  // Los 5 tramos siempre presentes (con 0 si nadie puso ese puntaje), así el gráfico no se deforma
  const distribucion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of porEstrella) distribucion[g.estrellas] = g._count._all;

  const cantidad = agg._count._all;

  return res.json({
    calificaciones,
    promedio: redondearPromedio(agg._avg.estrellas),
    cantidad,
    distribucion,
    atendidos,
    // Porcentaje de consultas completadas que terminaron en reseña
    tasaRespuesta: atendidos ? Math.round((cantidad / atendidos) * 100) : 0,
  });
};
