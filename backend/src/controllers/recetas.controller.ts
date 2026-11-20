import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { fechaDeEntrada, finDeHoy, sumarDias } from '../lib/fechas';
import { assertPacienteDelMedico, fichaDelMedico } from '../lib/medicoPaciente';
import { notify } from '../services/notifications.service';
import { inferirHorariosPorDefecto } from './recordatorios.controller';
import { buscarMedicamentoPorNombre } from './medicamentos.controller';
import { calcularCobertura } from '../lib/cobertura';

/**
 * Validez por defecto cuando el emisor no manda `validoHasta`.
 *
 * Toda receta tiene que vencer: antes el campo era opcional y una receta emitida sin fecha
 * quedaba vigente para siempre. La web ahora exige el campo, pero la app mobile todavía
 * puede omitirlo, así que el default se aplica acá y no en el front.
 */
const VALIDEZ_POR_DEFECTO_DIAS = 30;

// La validez acepta tanto "YYYY-MM-DD" (lo que manda un <input type="date">) como un ISO
// completo, y tiene que ser posterior a hoy: una receta que vence hoy mismo o ayer no sirve.
const validoHastaSchema = z
  .string()
  .transform(fechaDeEntrada)
  .refine((d): d is Date => d !== null, { message: 'La validez no es una fecha válida' })
  // Zod corre todos los refines aunque falle el anterior: si la fecha no parseó, este se saltea
  // para no devolver dos mensajes encadenados por el mismo problema.
  .refine(d => !d || d > finDeHoy(), { message: 'La validez tiene que ser una fecha posterior a hoy' });

const recetaSchema = z.object({
  pacienteId:  z.string().uuid(),
  medicoId:    z.string().uuid().optional(), // el médico logueado lo fija solo; el admin lo manda
  medicamento: z.string().min(2).max(80),
  // Medicamento del catálogo. Si viene, el nombre sale del catálogo y se aplica la cobertura
  // de la obra social. Si no, se intenta matchear `medicamento` por nombre.
  medicamentoId: z.string().uuid().nullable().optional(),
  dosis:       z.string().min(1).max(80),
  indicacion:  z.string().min(5).max(500),
  // Sigue siendo opcional en la API (mobile todavía puede no mandarlo), pero nunca queda
  // vacío en la base: si falta, se completa con VALIDEZ_POR_DEFECTO_DIAS al crear.
  validoHasta: validoHastaSchema.optional(),
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
  const medico = await fichaDelMedico(req.user!.userId);
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

  const { pacienteId, dosis, indicacion, validoHasta } = result.data;

  // El médico solo puede emitir a su nombre; el admin elige el médico
  let medicoId = result.data.medicoId;
  if (req.user!.role === 'MEDICO') {
    // Además de emitir a su nombre, el médico solo puede recetarle a pacientes de su agenda
    medicoId = await assertPacienteDelMedico(req.user!.userId, pacienteId);
  }
  if (!medicoId) throw new HttpError(400, 'Falta indicar el médico que emite la receta');

  const [paciente, medico] = await Promise.all([
    prisma.user.findUnique({ where: { id: pacienteId, role: 'PATIENT' } }),
    prisma.medico.findUnique({ where: { id: medicoId } }),
  ]);

  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  if (!medico)   return res.status(404).json({ error: 'Médico no encontrado' });

  // Resolver el medicamento del catálogo (por id, o por nombre si lo escribió a mano)
  let medicamento = result.data.medicamento.trim();
  let medicamentoId: string | null = null;
  if (result.data.medicamentoId) {
    const delCatalogo = await prisma.medicamento.findUnique({ where: { id: result.data.medicamentoId } });
    if (!delCatalogo) throw new HttpError(404, 'Medicamento no encontrado en el catálogo');
    medicamento = delCatalogo.nombre;
    medicamentoId = delCatalogo.id;
  } else {
    const match = await buscarMedicamentoPorNombre(medicamento);
    if (match) { medicamento = match.nombre; medicamentoId = match.id; }
  }

  // "Foto" de la cobertura de hoy: queda guardada en la receta
  const cobertura = await calcularCobertura(pacienteId, medicamentoId);

  const receta = await prisma.receta.create({
    data: {
      pacienteId, medicoId, medicamento, dosis, indicacion, medicamentoId,
      coberturaObraSocial: cobertura.porcentaje !== null ? cobertura.obraSocial : null,
      coberturaPorcentaje: cobertura.porcentaje,
      validoHasta: validoHasta ?? sumarDias(new Date(), VALIDEZ_POR_DEFECTO_DIAS),
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

  // Crear recordatorio automático en la agenda personal de salud del paciente
  try {
    const horariosPorDefecto = inferirHorariosPorDefecto(dosis);
    await prisma.recordatorioSalud.create({
      data: {
        pacienteId,
        recetaId: receta.id,
        titulo: medicamento,
        tipo: 'MEDICAMENTO',
        dosis,
        instrucciones: indicacion,
        horarios: horariosPorDefecto,
        fechaInicio: new Date(),
        fechaFin: receta.validoHasta,
        activo: true,
      },
    });
  } catch (err) {
    console.error('Error al autogenerar recordatorio en agenda:', err);
  }

  return res.status(201).json(receta);
};

// Médico o admin: preview de cuánto le cubre al paciente un medicamento, para mostrarlo en el
// formulario ANTES de emitir. GET /recetas/cobertura?pacienteId=...&medicamentoId=...
const previewSchema = z.object({
  pacienteId:    z.string().uuid(),
  medicamentoId: z.string().uuid().optional(),
});

export const getCoberturaPreview = async (req: Request, res: Response) => {
  const result = previewSchema.safeParse(req.query);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  if (req.user!.role === 'MEDICO') {
    await assertPacienteDelMedico(req.user!.userId, result.data.pacienteId);
  }
  return res.json(await calcularCobertura(result.data.pacienteId, result.data.medicamentoId));
};

// Médico o admin: eliminar una receta. El médico solo puede borrar las que emitió él;
// el admin, cualquiera. Sirve para corregir una receta cargada por error.
export const eliminarReceta = async (req: Request, res: Response) => {
  const { id } = req.params;

  const receta = await prisma.receta.findUnique({ where: { id } });
  if (!receta) throw new HttpError(404, 'Receta no encontrada');

  if (req.user!.role === 'MEDICO') {
    const propio = await fichaDelMedico(req.user!.userId);
    if (receta.medicoId !== propio.id) {
      throw new HttpError(403, 'Esa receta no fue emitida por vos');
    }
  }

  await prisma.receta.delete({ where: { id } });

  return res.json({ message: 'Receta eliminada' });
};
