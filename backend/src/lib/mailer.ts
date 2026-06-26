import nodemailer, { Transporter } from 'nodemailer';
import { SMTP, NODE_ENV, WEB_URL } from '../config/env';

// ────────────────────────────────────────────────────────────────
// Mailer: envía emails con nodemailer.
//  1) Si hay SMTP_HOST configurado → usa ese servidor real.
//  2) En dev sin SMTP → crea una cuenta de prueba Ethereal automática
//     (imprime un link de "preview" en la consola, no se envía a nadie real).
//  3) Si todo falla → imprime el contenido del email en la consola.
// Así verificación/reseteo funcionan SIN configurar nada en desarrollo.
// ────────────────────────────────────────────────────────────────

let transporterPromise: Promise<Transporter | null> | null = null;

async function getTransporter(): Promise<Transporter | null> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    // 1) SMTP real configurado por variables de entorno
    if (SMTP.host) {
      return nodemailer.createTransport({
        host: SMTP.host,
        port: SMTP.port,
        secure: SMTP.port === 465, // 465 = SSL; 587/25 = STARTTLS
        auth: SMTP.user ? { user: SMTP.user, pass: SMTP.pass } : undefined,
      });
    }

    // 2) Desarrollo sin SMTP: cuenta de prueba Ethereal
    if (NODE_ENV !== 'production') {
      try {
        const test = await nodemailer.createTestAccount();
        console.log('[mailer] Sin SMTP configurado → usando cuenta de prueba Ethereal');
        return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: test.user, pass: test.pass },
        });
      } catch {
        console.warn('[mailer] No se pudo crear la cuenta Ethereal; los emails se imprimirán en consola');
        return null;
      }
    }

    // 3) Producción sin SMTP: no hay forma de enviar
    console.warn('[mailer] SMTP no configurado en producción: los emails NO se enviarán');
    return null;
  })();

  return transporterPromise;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Envía un email. Nunca tira: si falla el transporte, loguea y sigue
// (no queremos que un fallo de SMTP rompa el registro o el reseteo).
export async function sendMail({ to, subject, html, text }: MailInput): Promise<void> {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`\n[mailer:consola] Para: ${to}\n  Asunto: ${subject}\n  ${text ?? html}\n`);
      return;
    }
    const info = await transporter.sendMail({ from: SMTP.from, to, subject, html, text });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[mailer] Email "${subject}" enviado → preview Ethereal: ${preview}`);
  } catch (err) {
    console.error('[mailer] Error enviando email:', err instanceof Error ? err.message : err);
  }
}

// ── Plantillas HTML ──────────────────────────────────────────────

function layout(titulo: string, intro: string, cta: { url: string; label: string }, nota: string): string {
  return `
  <div style="background:#f1f5f9;padding:32px 0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:#0f172a;padding:24px 28px;">
        <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">🏥 Hospital</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${titulo}</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">${intro}</p>
        <a href="${cta.url}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">${cta.label}</a>
        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">${nota}</p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;word-break:break-all;">Si el botón no funciona, copiá y pegá este enlace:<br>${cta.url}</p>
      </div>
    </div>
  </div>`;
}

export function verifyEmailTemplate(nombre: string, link: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Confirmá tu email — Hospital',
    html: layout(
      `¡Hola, ${nombre}!`,
      'Gracias por registrarte. Confirmá tu dirección de email para terminar de activar tu cuenta.',
      { url: link, label: 'Confirmar mi email' },
      'Este enlace vence en 24 horas. Si no creaste esta cuenta, ignorá este mensaje.',
    ),
    text: `Hola ${nombre}, confirmá tu email entrando a: ${link} (vence en 24 horas).`,
  };
}

export function resetPasswordTemplate(nombre: string, link: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Restablecé tu contraseña — Hospital',
    html: layout(
      `Hola, ${nombre}`,
      'Recibimos un pedido para restablecer la contraseña de tu cuenta. Hacé clic en el botón para elegir una nueva.',
      { url: link, label: 'Cambiar mi contraseña' },
      'Este enlace vence en 1 hora. Si no pediste esto, podés ignorar el mensaje: tu contraseña no cambiará.',
    ),
    text: `Hola ${nombre}, restablecé tu contraseña entrando a: ${link} (vence en 1 hora).`,
  };
}

// Email genérico para una notificación del sistema (turno confirmado/cancelado, receta nueva)
export function notificationEmailTemplate(titulo: string, mensaje: string, link?: string): { subject: string; html: string; text: string } {
  const url = link || WEB_URL;
  return {
    subject: `${titulo} — Hospital`,
    html: layout(
      titulo,
      mensaje,
      { url, label: 'Ver en la plataforma' },
      'Recibís este aviso porque tenés una cuenta en el sistema del Hospital.',
    ),
    text: `${titulo}\n\n${mensaje}\n\n${url}`,
  };
}
