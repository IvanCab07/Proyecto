import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Paciente/médico/admin: mis notificaciones (las últimas 30)
export const getNotifications = async (req: Request, res: Response) => {
  const items = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return res.json(items);
};

// Cantidad de no leídas (para el badge de la campana)
export const getUnreadCount = async (req: Request, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, leida: false },
  });
  return res.json({ count });
};

// Marcar una notificación como leída (solo si es del usuario logueado)
export const markRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await prisma.notification.updateMany({
    where: { id, userId: req.user!.userId },
    data: { leida: true },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Notificación no encontrada' });
  return res.json({ message: 'ok' });
};

// Marcar todas mis notificaciones como leídas
export const markAllRead = async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, leida: false },
    data: { leida: true },
  });
  return res.json({ message: 'ok' });
};
