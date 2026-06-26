import dotenv from 'dotenv';
dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// URL del front web (para construir los links de los emails de verificación/reseteo)
export const WEB_URL = (process.env.WEB_URL || 'http://localhost:5173').replace(/\/$/, '');

// SMTP (envío de emails). Si SMTP_HOST está vacío, el mailer usa una cuenta de
// prueba Ethereal en dev (imprime un link de preview) o cae a la consola.
export const SMTP = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || 'Hospital <no-reply@hospital.local>',
};
