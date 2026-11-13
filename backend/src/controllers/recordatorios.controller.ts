import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';

/**
 * Infiere horarios por defecto a partir de la descripción de la dosis.
 * Ej: "cada 8hs" -> 3 tomas al día.
 */
export function inferirHorariosPorDefecto(dosis: string): string[] {
  const d = dosis.toLowerCase();
  if (/8\s*(hs|horas|h)\b|cada\s*8/i.test(d)) {
    return ['08:00', '16:00', '00:00'];
  }
  if (/12\s*(hs|horas|h)\b|cada\s*12/i.test(d)) {
    return ['08:00', '20:00'];
  }
  if (/6\s*(hs|horas|h)\b|cada\s*6/i.test(d)) {
    return ['06:00', '12:00', '18:00', '00:00'];
  }
  if (/4\s*(hs|horas|h)\b|cada\s*4/i.test(d)) {
    return ['06:00', '10:00', '14:00', '18:00', '22:00', '02:00'];
  }
  // Por defecto (1 toma al día por la mañana)
  return ['09:00'];
}

const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const actualizarHorariosSchema = z.object({
  horarios: z.array(z.string().regex(horarioRegex, 'Formato de hora inválido (HH:MM)')).min(1, 'Debe haber al menos un horario'),
});

const marcarTomaSchema = z.object({
  fechaProgramada: z.string().datetime({ message: 'Fecha programada inválida' }),
  estado: z.enum(['TOMADO', 'OMITIDO', 'POSPUESTO', 'PENDIENTE']),
  notas: z.string().max(200).optional(),
});

const nuevoRecordatorioManualSchema = z.object({
  titulo: z.string().min(2).max(100),
  tipo: z.enum(['MEDICAMENTO', 'TRATAMIENTO']).default('MEDICAMENTO'),
  dosis: z.string().max(100).optional(),
  instrucciones: z.string().max(500).optional(),
  horarios: z.array(z.string().regex(horarioRegex, 'Formato de hora inválido (HH:MM)')).min(1),
  fechaFin: z.string().datetime().optional().nullable(),
});

/**
 * Paciente: Listar todos sus recordatorios activos en la agenda
 */
export const getMisRecordatorios = async (req: Request, res: Response) => {
  const pacienteId = req.user!.userId;
  const items = await prisma.recordatorioSalud.findMany({
    where: { pacienteId, activo: true },
    include: {
      receta: {
        include: {
          medico: { select: { nombre: true, apellido: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(items);
};

/**
 * Paciente: Obtener las tomas programadas para el día de hoy con su estado actual
 */
export const getTomasHoy = async (req: Request, res: Response) => {
  const pacienteId = req.user!.userId;
  const hoy = new Date();
  
  // Inicio y fin del día actual (00:00:00 a 23:59:59)
  const inicioDia = new Date(hoy);
  inicioDia.setHours(0, 0, 0, 0);

  const finDia = new Date(hoy);
  finDia.setHours(23, 59, 59, 999);

  // Obtener recordatorios activos cuyo período incluya hoy
  const recordatorios = await prisma.recordatorioSalud.findMany({
    where: {
      pacienteId,
      activo: true,
      fechaInicio: { lte: finDia },
      OR: [
        { fechaFin: null },
        { fechaFin: { gte: inicioDia } },
      ],
    },
    include: {
      tomas: {
        where: {
          fechaProgramada: {
            gte: inicioDia,
            lte: finDia,
          },
        },
      },
    },
  });

  // Aplanar y armar el timeline de hoy
  interface TomaTimeline {
    id: string; // ID único para UI
    recordatorioId: string;
    titulo: string;
    tipo: string;
    dosis: string | null;
    instrucciones: string | null;
    hora: string;
    fechaProgramada: Date;
    estado: 'PENDIENTE' | 'TOMADO' | 'OMITIDO' | 'POSPUESTO';
    fechaRealizada: Date | null;
    registroTomaId?: string;
  }

  const tomasHoy: TomaTimeline[] = [];

  for (const r of recordatorios) {
    const horarios = (Array.isArray(r.horarios) ? r.horarios : []) as string[];

    for (const hora of horarios) {
      const [h, m] = hora.split(':').map(Number);
      const fechaProg = new Date(hoy);
      fechaProg.setHours(h, m, 0, 0);

      // Buscar si ya existe un registro de toma para este horario hoy
      const registroExistente = r.tomas.find(t => {
        const d = new Date(t.fechaProgramada);
        return d.getHours() === h && d.getMinutes() === m;
      });

      tomasHoy.push({
        id: `${r.id}-${hora}`,
        recordatorioId: r.id,
        titulo: r.titulo,
        tipo: r.tipo,
        dosis: r.dosis,
        instrucciones: r.instrucciones,
        hora,
        fechaProgramada: fechaProg,
        estado: registroExistente ? registroExistente.estado : 'PENDIENTE',
        fechaRealizada: registroExistente ? registroExistente.fechaRealizada : null,
        registroTomaId: registroExistente?.id,
      });
    }
  }

  // Ordenar por hora cronológica
  tomasHoy.sort((a, b) => a.hora.localeCompare(b.hora));

  return res.json(tomasHoy);
};

/**
 * Paciente: Actualizar horarios de un recordatorio
 */
export const actualizarHorarios = async (req: Request, res: Response) => {
  const { id } = req.params;
  const pacienteId = req.user!.userId;

  const result = actualizarHorariosSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const recordatorio = await prisma.recordatorioSalud.findUnique({ where: { id } });
  if (!recordatorio || recordatorio.pacienteId !== pacienteId) {
    throw new HttpError(404, 'Recordatorio no encontrado');
  }

  const updated = await prisma.recordatorioSalud.update({
    where: { id },
    data: { horarios: result.data.horarios },
  });

  return res.json(updated);
};

/**
 * Paciente: Marcar una toma (TOMADO / OMITIDO / POSPUESTO)
 */
export const registrarToma = async (req: Request, res: Response) => {
  const { id } = req.params;
  const pacienteId = req.user!.userId;

  const result = marcarTomaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const recordatorio = await prisma.recordatorioSalud.findUnique({ where: { id } });
  if (!recordatorio || recordatorio.pacienteId !== pacienteId) {
    throw new HttpError(404, 'Recordatorio no encontrado');
  }

  const fechaProg = new Date(result.data.fechaProgramada);

  // Buscar si ya existe una toma para ese recordatorio en esa fecha y hora
  const inicioVentana = new Date(fechaProg);
  inicioVentana.setSeconds(0, 0);
  const finVentana = new Date(fechaProg);
  finVentana.setSeconds(59, 999);

  const existente = await prisma.registroToma.findFirst({
    where: {
      recordatorioId: id,
      fechaProgramada: {
        gte: inicioVentana,
        lte: finVentana,
      },
    },
  });

  let registro;
  if (existente) {
    registro = await prisma.registroToma.update({
      where: { id: existente.id },
      data: {
        estado: result.data.estado,
        fechaRealizada: result.data.estado === 'TOMADO' ? new Date() : null,
        notas: result.data.notas,
      },
    });
  } else {
    registro = await prisma.registroToma.create({
      data: {
        recordatorioId: id,
        pacienteId,
        fechaProgramada: fechaProg,
        fechaRealizada: result.data.estado === 'TOMADO' ? new Date() : null,
        estado: result.data.estado,
        notas: result.data.notas,
      },
    });
  }

  return res.status(200).json(registro);
};

/**
 * Paciente: Crear recordatorio manual (no originado por receta médica)
 */
export const crearRecordatorioManual = async (req: Request, res: Response) => {
  const pacienteId = req.user!.userId;

  const result = nuevoRecordatorioManualSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const nuevo = await prisma.recordatorioSalud.create({
    data: {
      pacienteId,
      titulo: result.data.titulo,
      tipo: result.data.tipo,
      dosis: result.data.dosis,
      instrucciones: result.data.instrucciones,
      horarios: result.data.horarios,
      fechaFin: result.data.fechaFin ? new Date(result.data.fechaFin) : null,
      activo: true,
    },
  });

  return res.status(201).json(nuevo);
};

/**
 * Paciente: Activar o pausar un recordatorio
 */
export const toggleActivo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const pacienteId = req.user!.userId;

  const recordatorio = await prisma.recordatorioSalud.findUnique({ where: { id } });
  if (!recordatorio || recordatorio.pacienteId !== pacienteId) {
    throw new HttpError(404, 'Recordatorio no encontrado');
  }

  const updated = await prisma.recordatorioSalud.update({
    where: { id },
    data: { activo: !recordatorio.activo },
  });

  return res.json(updated);
};
