import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { notify } from '../services/notifications.service';

const recetaSchema = z.object({
  pacienteId:  z.string().uuid(),
  medicoId:    z.string().uuid().optional(), // el médico logueado lo fija solo; el admin lo manda
  medicamento: z.string().min(2),
  dosis:       z.string().min(1),
  indicacion:  z.string().min(5),
  validoHasta: z.string().datetime().optional(),
});

// Paciente: mis recetas
export const getMisRecetas = async (req: Request, res: Response) => {
  const recetas = await prisma.receta.findMany({
    where: { pacienteId: req.user!.userId },
    include: { medico: { include: { especialidad: true } } },
    orderBy: { fechaEmision: 'desc' },
  });
  return res.json(recetas);
};

// Médico: recetas que emitió
export const getRecetasMedico = async (req: Request, res: Response) => {
  const medico = await prisma.medico.findUnique({ where: { userId: req.user!.userId } });
  if (!medico) throw new HttpError(403, 'Tu cuenta no está vinculada a una ficha de médico');
  const recetas = await prisma.receta.findMany({
    where: { medicoId: medico.id },
    include: { paciente: { select: { id: true, nombre: true, apellido: true, dni: true } } },
    orderBy: { fechaEmision: 'desc' },
  });
  return res.json(recetas);
};

// Médico o admin: emitir receta para un paciente
export const crearReceta = async (req: Request, res: Response) => {
  const result = recetaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: formatZodError(result.error) });
  }

  const { pacienteId, medicamento, dosis, indicacion, validoHasta } = result.data;

  // El médico solo puede emitir a su nombre; el admin elige el médico
  let medicoId = result.data.medicoId;
  if (req.user!.role === 'MEDICO') {
    const propio = await prisma.medico.findUnique({ where: { userId: req.user!.userId } });
    if (!propio) throw new HttpError(403, 'Tu cuenta no está vinculada a una ficha de médico');
    medicoId = propio.id;
  }
  if (!medicoId) throw new HttpError(400, 'Falta indicar el médico que emite la receta');

  const [paciente, medico] = await Promise.all([
    prisma.user.findUnique({ where: { id: pacienteId, role: 'PATIENT' } }),
    prisma.medico.findUnique({ where: { id: medicoId } }),
  ]);

  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  if (!medico)   return res.status(404).json({ error: 'Médico no encontrado' });

  const receta = await prisma.receta.create({
    data: {
      pacienteId, medicoId, medicamento, dosis, indicacion,
      ...(validoHasta && { validoHasta: new Date(validoHasta) }),
    },
    include: {
      medico: { include: { especialidad: true } },
      paciente: { select: { nombre: true, apellido: true } },
    },
  });

  // Avisar al paciente que tiene una receta nueva
  await notify(pacienteId, 'RECETA_NUEVA', 'Nueva receta disponible',
    `El Dr. ${receta.medico.apellido} te emitió una receta: ${medicamento}.`,
    { email: true, link: '/paciente/recetas', data: { recetaId: receta.id } });

  return res.status(201).json(receta);
};
