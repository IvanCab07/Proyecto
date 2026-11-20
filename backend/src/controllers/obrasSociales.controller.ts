import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { obraSocialNombreSchema, porcentajeSchema, normalizar } from '../lib/validaciones';

const obsSchema = z.object({ nombre: obraSocialNombreSchema });

async function nombreYaUsado(nombre: string, exceptoId?: string): Promise<boolean> {
  const existentes = await prisma.obraSocial.findMany({ select: { id: true, nombre: true } });
  const buscado = normalizar(nombre);
  return existentes.some(o => o.id !== exceptoId && normalizar(o.nombre) === buscado);
}

export const getObrasSociales = async (_req: Request, res: Response) => {
  const obrasSociales = await prisma.obraSocial.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { pacientes: true } } },
  });
  return res.json(obrasSociales);
};

export const crearObraSocial = async (req: Request, res: Response) => {
  const result = obsSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  if (await nombreYaUsado(result.data.nombre)) {
    throw new HttpError(409, 'Ya existe esa obra social');
  }

  const obraSocial = await prisma.obraSocial.create({ data: result.data });
  return res.status(201).json(obraSocial);
};
// ── Coberturas de medicamentos ──────────────────────────────

const coberturaSchema = z.object({ porcentaje: porcentajeSchema });

async function assertObraSocial(id: string) {
  const obra = await prisma.obraSocial.findUnique({ where: { id } });
  if (!obra) throw new HttpError(404, 'Obra social no encontrada');
  return obra;
}

// Cualquier usuario logueado: qué medicamentos cubre una obra social y en qué porcentaje.
export const getCoberturas = async (req: Request, res: Response) => {
  await assertObraSocial(req.params.id);
  const coberturas = await prisma.coberturaMedicamento.findMany({
    where: { obraSocialId: req.params.id },
    include: { medicamento: { select: { id: true, nombre: true } } },
    orderBy: { medicamento: { nombre: 'asc' } },
  });
  return res.json(coberturas);
};

// Admin: crear o cambiar el porcentaje de un medicamento (upsert: una sola ruta para las dos cosas).
export const guardarCobertura = async (req: Request, res: Response) => {
  const result = coberturaSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  const { id: obraSocialId, medicamentoId } = req.params;
  await assertObraSocial(obraSocialId);
  const medicamento = await prisma.medicamento.findUnique({ where: { id: medicamentoId } });
  if (!medicamento) throw new HttpError(404, 'Medicamento no encontrado');

  const cobertura = await prisma.coberturaMedicamento.upsert({
    where: { obraSocialId_medicamentoId: { obraSocialId, medicamentoId } },
    update: { porcentaje: result.data.porcentaje },
    create: { obraSocialId, medicamentoId, porcentaje: result.data.porcentaje },
    include: { medicamento: { select: { id: true, nombre: true } } },
  });
  return res.json(cobertura);
};

// Admin: quitar la cobertura de un medicamento.
export const eliminarCobertura = async (req: Request, res: Response) => {
  const { id: obraSocialId, medicamentoId } = req.params;
  const { count } = await prisma.coberturaMedicamento.deleteMany({ where: { obraSocialId, medicamentoId } });
  if (!count) throw new HttpError(404, 'Esa obra social no cubre ese medicamento');
  return res.json({ message: 'Cobertura eliminada' });
};
