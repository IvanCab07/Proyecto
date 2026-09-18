import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { obraSocialNombreSchema, normalizar } from '../lib/validaciones';

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