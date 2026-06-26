import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Paciente: subir un estudio (el archivo lo procesa upload.middleware antes de llegar acá)
export const uploadEstudio = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Archivo requerido (PDF, JPG o PNG, máx 10MB)' });
  }
  const estudio = await prisma.estudio.create({
    data: {
      pacienteId:  req.user!.userId,
      titulo:      req.body.titulo || req.file.originalname,
      descripcion: req.body.descripcion || null,
      archivoUrl:  `/uploads/${req.file.filename}`,
      tipoArchivo: req.file.mimetype,
    },
  });
  return res.status(201).json(estudio);
};

// Paciente: mis estudios
export const getMisEstudios = async (req: Request, res: Response) => {
  const estudios = await prisma.estudio.findMany({
    where: { pacienteId: req.user!.userId },
    orderBy: { fecha: 'desc' },
  });
  return res.json(estudios);
};

// Admin: estudios de un paciente
export const getEstudiosPaciente = async (req: Request, res: Response) => {
  const estudios = await prisma.estudio.findMany({
    where: { pacienteId: req.params.pacienteId },
    orderBy: { fecha: 'desc' },
  });
  return res.json(estudios);
};
