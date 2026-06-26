import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendMail, notificationEmailTemplate } from '../lib/mailer';
import { WEB_URL } from '../config/env';

// ────────────────────────────────────────────────────────────────
// Servicio de notificaciones. `notify` crea la notificación in-app
// (await rápido: un insert) y, si se pide email, lo manda en segundo
// plano para no demorar la respuesta de la API. Nunca lanza: un fallo
// de notificación no debe romper la acción que la disparó.
// ────────────────────────────────────────────────────────────────

interface NotifyOptions {
  data?: Record<string, unknown>;  // contexto extra: { turnoId?, recetaId? }
  link?: string;                   // ruta relativa para el CTA (ej '/paciente/turnos')
  email?: boolean;                 // si true, además envía un email
}

export async function notify(
  userId: string,
  type: NotificationType,
  titulo: string,
  mensaje: string,
  opts: NotifyOptions = {},
): Promise<void> {
  const payload = { ...(opts.data ?? {}), ...(opts.link ? { link: opts.link } : {}) };

  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        titulo,
        mensaje,
        ...(Object.keys(payload).length > 0 && { data: payload as Prisma.InputJsonValue }),
      },
    });
  } catch (err) {
    console.error('[notify] no se pudo crear la notificación:', err instanceof Error ? err.message : err);
    return;
  }

  // Email en segundo plano (sendMail ya captura sus propios errores)
  if (opts.email) {
    void prisma.user
      .findUnique({ where: { id: userId }, select: { email: true } })
      .then((user) => {
        if (!user) return;
        const { subject, html, text } = notificationEmailTemplate(
          titulo,
          mensaje,
          opts.link ? `${WEB_URL}${opts.link}` : undefined,
        );
        return sendMail({ to: user.email, subject, html, text });
      })
      .catch((err) => console.error('[notify:email]', err instanceof Error ? err.message : err));
  }
}

// Notifica a todos los administradores (in-app, sin email)
export async function notifyAdmins(
  type: NotificationType,
  titulo: string,
  mensaje: string,
  opts: NotifyOptions = {},
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map((a) => notify(a.id, type, titulo, mensaje, opts)));
  } catch (err) {
    console.error('[notifyAdmins] error:', err instanceof Error ? err.message : err);
  }
}
