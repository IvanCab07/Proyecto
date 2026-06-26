import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { notify, notifyAdmins } from '../services/notifications.service';

// Fecha corta dd/mm/yyyy para los mensajes de notificación
const fechaCorta = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

const turnoSchema = z.object({
  medicoId:     z.string().uuid(),
  fecha:        z.string().datetime(),
  hora:         z.string().regex(/^\d{2}:\d{2}$/),
  motivo:       z.string().optional(),
  esSobreturno: z.boolean().optional(),  // el paciente acepta tomar un horario ocupado como sobreturno
});

// Estados válidos de un turno (debe coincidir con el enum TurnoStatus del schema de Prisma)
const turnoStatusEnum = z.enum(['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO', 'EN_ESPERA', 'AUSENTE']);

// Estados que "ocupan" el horario (un turno activo). Si uno de estos se libera, se cede el sobreturno.
const ESTADOS_OCUPAN = ['PENDIENTE', 'CONFIRMADO'] as const;

// Límites del día (00:00 a 23:59:59) de una fecha, para buscar por día sin importar la hora exacta guardada.
function rangoDelDia(fecha: Date): { gte: Date; lte: Date } {
  const gte = new Date(fecha); gte.setHours(0, 0, 0, 0);
  const lte = new Date(fecha); lte.setHours(23, 59, 59, 999);
  return { gte, lte };
}

// Cede el sobreturno más antiguo en cola para (médico, día, hora) cuando se libera el horario.
// Lo promueve a CONFIRMADO y avisa al paciente. No lanza: un fallo acá no debe romper la acción que la disparó.
async function cederSobreturno(medicoId: string, fecha: Date, hora: string): Promise<void> {
  try {
    const siguiente = await prisma.turno.findFirst({
      where: { medicoId, hora, status: 'EN_ESPERA', fecha: rangoDelDia(fecha) },
      orderBy: { createdAt: 'asc' },
    });
    if (!siguiente) return;

    const cedido = await prisma.turno.update({
      where: { id: siguiente.id },
      data: { status: 'CONFIRMADO' },
      include: { medico: { include: { especialidad: true } } },
    });

    await notify(
      cedido.pacienteId,
      'SOBRETURNO_ASIGNADO',
      '¡Se te cedió el turno!',
      `Se liberó el turno de ${cedido.medico.especialidad.nombre} con Dr. ${cedido.medico.apellido} del ${fechaCorta(cedido.fecha)} a las ${cedido.hora}. Tu sobreturno fue confirmado: ahora el turno es tuyo.`,
      { link: '/paciente/turnos', data: { turnoId: cedido.id }, email: true },
    );
  } catch (err) {
    console.error('[cederSobreturno]', err instanceof Error ? err.message : err);
  }
}

const updateStatusSchema = z.object({
  status:      turnoStatusEnum,
  notas:       z.string().optional(),
  diagnostico: z.string().optional(),
});


export const crearTurno = async (req: Request, res: Response) => {
  const result = turnoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const { medicoId, fecha, hora, motivo, esSobreturno } = result.data;

  const turnoDate = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (turnoDate < hoy) {
    return res.status(400).json({ error: 'No se pueden crear turnos en fechas pasadas' });
  }

  const pacienteId = req.user!.userId;

  // Conflicto = el médico ya tiene un turno activo ese día y hora (se evalúa por día,
  // igual que la disponibilidad, no por timestamp exacto, para ser consistentes).
  const conflicto = await prisma.turno.findFirst({
    where: {
      medicoId,
      fecha: rangoDelDia(new Date(fecha)),
      hora,
      status: { in: [...ESTADOS_OCUPAN] },
    },
  });

  // Si el horario está ocupado: o se rechaza (turno normal) o se anota como sobreturno (en espera).
  if (conflicto && !esSobreturno) {
    return res.status(409).json({ error: 'El médico ya tiene un turno en ese horario' });
  }

  // El paciente no puede tener dos turnos para el mismo médico/día/hora (incluye sobreturnos propios).
  const propioEnEseHorario = await prisma.turno.findFirst({
    where: {
      pacienteId, medicoId, hora, fecha: rangoDelDia(new Date(fecha)),
      status: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_ESPERA'] },
    },
  });
  if (propioEnEseHorario) {
    return res.status(409).json({ error: 'Ya tenés un turno o sobreturno con ese médico en ese horario' });
  }

  // Sólo es sobreturno si realmente había conflicto; si el horario quedó libre, se crea como turno normal.
  const comoSobreturno = Boolean(conflicto && esSobreturno);

  const turno = await prisma.turno.create({
    data: {
      pacienteId, medicoId, fecha: new Date(fecha), hora, motivo,
      esSobreturno: comoSobreturno,
      status: comoSobreturno ? 'EN_ESPERA' : 'PENDIENTE',
    },
    include: { medico: { include: { especialidad: true } } },
  });

  // Avisar a los administradores del nuevo turno / sobreturno
  if (comoSobreturno) {
    await notifyAdmins(
      'SOBRETURNO_SOLICITADO',
      'Nuevo sobreturno en espera',
      `Un paciente se anotó como sobreturno de ${turno.medico.especialidad.nombre} para el ${fechaCorta(turno.fecha)} a las ${turno.hora}. Quedará confirmado si se libera el horario.`,
      { link: '/admin/turnos', data: { turnoId: turno.id } },
    );
  } else {
    await notifyAdmins(
      'TURNO_SOLICITADO',
      'Nuevo turno solicitado',
      `Un paciente solicitó un turno de ${turno.medico.especialidad.nombre} para el ${fechaCorta(turno.fecha)} a las ${turno.hora}.`,
      { link: '/admin/turnos', data: { turnoId: turno.id } },
    );
  }

  return res.status(201).json(turno);
};


export const getMisTurnos = async (req: Request, res: Response) => {

  const turnos = await prisma.turno.findMany({
    where: { pacienteId: req.user!.userId },
    include: { medico: { include: { especialidad: true } }, calificacion: true },
    orderBy: { fecha: 'desc' },
  });
  return res.json(turnos);
};


export const getAllTurnos = async (req: Request, res: Response) => {

  const { status, fecha } = req.query;

  // Solo aplicamos los filtros si son válidos; un valor inválido se ignora
  // (antes producía un error de Prisma → 500 en vez de devolver la lista)
  const statusParsed = turnoStatusEnum.safeParse(status);
  const fechaDate = typeof fecha === 'string' ? new Date(fecha) : null;
  const fechaValida = !!fechaDate && !isNaN(fechaDate.getTime());

  const turnos = await prisma.turno.findMany({
    where: {

      ...(statusParsed.success && { status: statusParsed.data }),

      ...(fechaValida && { fecha: fechaDate }),
    },
    include: {

      paciente: { select: { id: true, nombre: true, apellido: true, dni: true } },

      medico: { include: { especialidad: true } },

      calificacion: true,
    },
    orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
  });

  return res.json(turnos);
};


// Resuelve la ficha de Medico a partir de la cuenta logueada (rol MEDICO)
async function medicoIdDeUsuario(userId: string): Promise<string> {
  const medico = await prisma.medico.findUnique({ where: { userId } });
  if (!medico) throw new HttpError(403, 'Tu cuenta no está vinculada a una ficha de médico');
  return medico.id;
}

// Médico: sus propios turnos (agenda)
export const getTurnosMedico = async (req: Request, res: Response) => {
  const medicoId = await medicoIdDeUsuario(req.user!.userId);
  const turnos = await prisma.turno.findMany({
    where: { medicoId },
    include: {
      paciente: { select: { id: true, nombre: true, apellido: true, dni: true } },
      calificacion: true,
    },
    orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
  });
  return res.json(turnos);
};

export const updateTurnoStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = updateStatusSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }
  const { status, notas, diagnostico } = result.data;

  // Un médico solo puede tocar sus propios turnos; el admin, cualquiera
  if (req.user!.role === 'MEDICO') {
    const medicoId = await medicoIdDeUsuario(req.user!.userId);
    const propio = await prisma.turno.findUnique({ where: { id } });
    if (!propio || propio.medicoId !== medicoId) {
      throw new HttpError(403, 'Ese turno no pertenece a tu agenda');
    }
  }

  // Si el turno ocupaba el horario y ahora se libera (cancelado/ausente), después habrá que ceder el sobreturno.
  const previo = await prisma.turno.findUnique({ where: { id }, select: { status: true } });
  const liberaHorario =
    !!previo &&
    (status === 'CANCELADO' || status === 'AUSENTE') &&
    (ESTADOS_OCUPAN as readonly string[]).includes(previo.status);

  const turno = await prisma.turno.update({
    where: { id },
    data: {
      status,
      ...(notas !== undefined && { notas }),
      ...(diagnostico !== undefined && { diagnostico }),
    },
  });

  // Avisar al paciente según el nuevo estado de su turno
  const fechaTxt = `${fechaCorta(turno.fecha)} a las ${turno.hora}`;
  const ctx = { link: '/paciente/turnos', data: { turnoId: turno.id } };
  if (turno.status === 'CONFIRMADO') {
    await notify(turno.pacienteId, 'TURNO_CONFIRMADO', 'Turno confirmado',
      `Tu turno del ${fechaTxt} fue confirmado.`, { ...ctx, email: true });
  } else if (turno.status === 'CANCELADO') {
    await notify(turno.pacienteId, 'TURNO_CANCELADO', 'Turno cancelado',
      `Tu turno del ${fechaTxt} fue cancelado.`, { ...ctx, email: true });
  } else if (turno.status === 'AUSENTE') {
    await notify(turno.pacienteId, 'TURNO_CANCELADO', 'Turno marcado como ausente',
      `Tu turno del ${fechaTxt} se marcó como ausente (no asististe).`, ctx);
  } else if (turno.status === 'COMPLETADO') {
    await notify(turno.pacienteId, 'TURNO_COMPLETADO', 'Consulta completada',
      `Tu turno del ${fechaTxt} se marcó como completado.`, ctx);
  }

  // Si se liberó el horario, ceder el sobreturno más antiguo en cola.
  if (liberaHorario) {
    await cederSobreturno(turno.medicoId, turno.fecha, turno.hora);
  }

  return res.json(turno);
};


export const cancelarTurno = async (req: Request, res: Response) => {
  const { id } = req.params;


  const turno = await prisma.turno.findUnique({ where: { id } });


  if (!turno || turno.pacienteId !== req.user!.userId) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  if (turno.status === 'COMPLETADO') {
    return res.status(400).json({ error: 'No se puede cancelar un turno completado' });
  }


  const { razonCancelacion } = req.body;

  await prisma.turno.update({
    where: { id },
    data: {
      status: 'CANCELADO',
      ...(razonCancelacion && { razonCancelacion: razonCancelacion.trim() }),
    },
  });

  // Avisar a los administradores y al médico (si tiene cuenta) de la cancelación
  const fechaTxt = `${fechaCorta(turno.fecha)} a las ${turno.hora}`;
  await notifyAdmins('TURNO_CANCELADO', 'Turno cancelado por el paciente',
    `Un paciente canceló su turno del ${fechaTxt}.`,
    { link: '/admin/turnos', data: { turnoId: turno.id } });

  const medicoFicha = await prisma.medico.findUnique({ where: { id: turno.medicoId }, select: { userId: true } });
  if (medicoFicha?.userId) {
    await notify(medicoFicha.userId, 'TURNO_CANCELADO', 'Turno cancelado',
      `Se canceló un turno de tu agenda del ${fechaTxt}.`,
      { link: '/medico/agenda', data: { turnoId: turno.id } });
  }

  // Si el turno cancelado ocupaba el horario, ceder el sobreturno más antiguo en cola.
  if ((ESTADOS_OCUPAN as readonly string[]).includes(turno.status)) {
    await cederSobreturno(turno.medicoId, turno.fecha, turno.hora);
  }

  return res.json({ message: 'Turno cancelado' });
};


// Admin: estadísticas generales del sistema (dashboard y reportes)
export const getStats = async (_req: Request, res: Response) => {
  const ahora = new Date();
  const inicioHoy = new Date(ahora); inicioHoy.setHours(0, 0, 0, 0);
  const finHoy    = new Date(ahora); finHoy.setHours(23, 59, 59, 999);
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const finMes    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

  const [total, pendientes, confirmados, completados, cancelados, turnosHoy, turnosMes, totalPacientes, medicosDisp] =
    await Promise.all([
      prisma.turno.count(),
      prisma.turno.count({ where: { status: 'PENDIENTE' } }),
      prisma.turno.count({ where: { status: 'CONFIRMADO' } }),
      prisma.turno.count({ where: { status: 'COMPLETADO' } }),
      prisma.turno.count({ where: { status: 'CANCELADO' } }),
      prisma.turno.count({ where: { fecha: { gte: inicioHoy, lte: finHoy } } }),
      prisma.turno.count({ where: { fecha: { gte: inicioMes, lte: finMes } } }),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.medico.count({ where: { disponible: true } }),
    ]);

  const topMedicos = await prisma.medico.findMany({
    include: { especialidad: true, _count: { select: { turnos: true } } },
    orderBy: { turnos: { _count: 'desc' } },
    take: 5,
  });

  const especialidades = await prisma.especialidad.findMany({
    include: {
      _count: { select: { medicos: true } },
      medicos: { select: { _count: { select: { turnos: true } } } },
    },
  });

  return res.json({
    turnos: { total, pendientes, confirmados, completados, cancelados, hoy: turnosHoy, mes: turnosMes },
    usuarios: { pacientes: totalPacientes },
    medicos: { disponibles: medicosDisp },
    topMedicos: topMedicos.map(m => ({
      nombre: `Dr. ${m.apellido}, ${m.nombre}`,
      especialidad: m.especialidad.nombre,
      total: m._count.turnos,
    })),
    porEspecialidad: especialidades.map(e => ({
      nombre: e.nombre,
      medicos: e._count.medicos,
      turnos: e.medicos.reduce((acc: number, m: any) => acc + m._count.turnos, 0),
    })),
  });
};
