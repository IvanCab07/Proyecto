import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { medicamentoNombreSchema, normalizar } from '../lib/validaciones';

const medicamentoSchema = z.object({ nombre: medicamentoNombreSchema });

/** Busca un medicamento del catálogo por nombre, ignorando acentos y mayúsculas. */
export async function buscarMedicamentoPorNombre(nombre: string) {
  const todos = await prisma.medicamento.findMany({ select: { id: true, nombre: true } });
  const buscado = normalizar(nombre);
  return todos.find(m => normalizar(m.nombre) === buscado) ?? null;
}

// Cualquier usuario logueado: el médico lo usa para autocompletar al recetar.
export const getMedicamentos = async (_req: Request, res: Response) => {
  const medicamentos = await prisma.medicamento.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { coberturas: true } } },
  });
  return res.json(medicamentos);
};

// Admin: agregar un medicamento al catálogo.
export const crearMedicamento = async (req: Request, res: Response) => {
  const result = medicamentoSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: formatZodError(result.error) });

  if (await buscarMedicamentoPorNombre(result.data.nombre)) {
    throw new HttpError(409, 'Ya existe ese medicamento');
  }

  const medicamento = await prisma.medicamento.create({ data: result.data });
  return res.status(201).json(medicamento);
};

// Admin: borrar un medicamento. Sus coberturas se borran en cascada; las recetas ya emitidas
// conservan el nombre y el porcentaje que quedaron guardados.
export const eliminarMedicamento = async (req: Request, res: Response) => {
  const existe = await prisma.medicamento.findUnique({ where: { id: req.params.id } });
  if (!existe) throw new HttpError(404, 'Medicamento no encontrado');
  await prisma.medicamento.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Medicamento eliminado' });
};
