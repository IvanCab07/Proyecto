import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, formatZodError } from '../lib/httpError';
import { tituloEstudioSchema, descripcionEstudioSchema } from '../lib/validaciones';
import { assertPacienteDelMedico } from '../lib/medicoPaciente';
import { borrarArchivo } from '../lib/archivos';

// El título es opcional en la API: si no viene, se usa el nombre del archivo. Pero si viene,
// tiene que ser válido — antes entraba cualquier cosa y un título de más de 191 caracteres
// pasaba la subida y explotaba recién en el INSERT, con el archivo ya guardado en disco.
const metadatosSchema = z.object({
  // Igual que la descripción: el FormData siempre manda el campo, así que un título vacío
  // llega como "" y hay que tratarlo como "no informado" y no como un título de 0 caracteres.
  titulo: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    tituloEstudioSchema.optional(),
  ),
  descripcion: descripcionEstudioSchema,
});

// Campos que se devuelven siempre. `subidoPorId` le sirve al front para saber si
// el usuario actual puede borrar ese estudio o solo verlo.
const CAMPOS = {
  id: true, pacienteId: true, subidoPorId: true, titulo: true,
  descripcion: true, archivoUrl: true, tipoArchivo: true, fecha: true,
} as const;

// Subir un estudio. El paciente sube los suyos; el médico o el admin pueden subir
// a nombre de un paciente mandando `pacienteId` en el body.
// (el archivo lo procesa upload.middleware antes de llegar acá)
export const uploadEstudio = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Archivo requerido (PDF, JPG o PNG, máx 10MB)' });
  }

  // Multer ya guardó el archivo en disco antes de llegar acá, así que si los metadatos no
  // pasan hay que borrarlo: si no, cada intento fallido deja basura en uploads/.
  const meta = metadatosSchema.safeParse(req.body);
  if (!meta.success) {
    await borrarArchivo(`/uploads/${req.file.filename}`);
    return res.status(400).json({ error: formatZodError(meta.error) });
  }

  const { role, userId } = req.user!;
  const destino = typeof req.body.pacienteId === 'string' ? req.body.pacienteId.trim() : '';

  // Por defecto el estudio es del propio usuario; solo médico y admin pueden cargarlo a otro
  let pacienteId = userId;
  if (destino && destino !== userId) {
    if (role === 'PATIENT') {
      await borrarArchivo(`/uploads/${req.file.filename}`);
      throw new HttpError(403, 'No podés subir estudios a nombre de otra persona');
    }
    // El médico solo puede cargarle estudios a pacientes de su agenda
    if (role === 'MEDICO') await assertPacienteDelMedico(userId, destino);
    pacienteId = destino;
  }

  const estudio = await prisma.estudio.create({
    data: {
      pacienteId,
      subidoPorId: userId,
      titulo:      meta.data.titulo ?? req.file.originalname,
      descripcion: meta.data.descripcion ?? null,
      archivoUrl:  `/uploads/${req.file.filename}`,
      tipoArchivo: req.file.mimetype,
    },
    select: CAMPOS,
  });
  return res.status(201).json(estudio);
};

// Paciente: mis estudios
export const getMisEstudios = async (req: Request, res: Response) => {
  const estudios = await prisma.estudio.findMany({
    where: { pacienteId: req.user!.userId },
    orderBy: { fecha: 'desc' },
    select: CAMPOS,
  });
  return res.json(estudios);
};

// Médico o admin: estudios de un paciente. El médico solo los de sus propios pacientes.
export const getEstudiosPaciente = async (req: Request, res: Response) => {
  const { pacienteId } = req.params;

  if (req.user!.role === 'MEDICO') {
    await assertPacienteDelMedico(req.user!.userId, pacienteId);
  }

  const estudios = await prisma.estudio.findMany({
    where: { pacienteId },
    orderBy: { fecha: 'desc' },
    select: CAMPOS,
  });
  return res.json(estudios);
};

// Eliminar un estudio: el paciente los suyos, el médico solo los que él subió,
// el admin cualquiera. Así un médico no puede borrar documentación del paciente.
export const eliminarEstudio = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, userId } = req.user!;

  const estudio = await prisma.estudio.findUnique({ where: { id } });
  if (!estudio) throw new HttpError(404, 'Estudio no encontrado');

  if (role === 'PATIENT' && estudio.pacienteId !== userId) {
    throw new HttpError(403, 'Ese estudio no es tuyo');
  }
  if (role === 'MEDICO' && estudio.subidoPorId !== userId) {
    throw new HttpError(403, 'Solo podés eliminar los estudios que subiste vos');
  }

  await prisma.estudio.delete({ where: { id } });
  await borrarArchivo(estudio.archivoUrl);

  return res.json({ message: 'Estudio eliminado' });
};
