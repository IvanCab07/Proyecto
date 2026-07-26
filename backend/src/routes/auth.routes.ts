import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register, login, me, actualizarPerfil, cambiarPassword,
  verifyEmail, resendVerification, forgotPassword, resetPassword,
  twoFactorSetup, twoFactorEnable, twoFactorDisable, twoFactorLogin,
} from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

/**
 * Límite propio para los endpoints donde se adivinan credenciales.
 *
 * El limitador global de index.ts da 100 requests cada 15 minutos a TODA la API, que para
 * navegar el panel está bien pero deja lugar de sobra para probar contraseñas. Estos son
 * 10 intentos por IP en la misma ventana, y solo cuentan los que fallan: al que entra bien
 * no se le descuenta nada (`skipSuccessfulRequests`).
 */
const intentosLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Esperá unos minutos y volvé a probar.' },
});

/**
 * El registro tiene su propio limitador y NO reusa `intentosLimit`.
 *
 * Cada llamada a rateLimit() crea su propio contador, así que compartir la instancia entre
 * /register y /login haría que los dos endpoints gasten la misma cuota: unos cuantos registros
 * rechazados por validación dejarían al usuario sin poder iniciar sesión durante 15 minutos.
 *
 * Sin ningún tope, en cambio, este es el endpoint más barato para crear cuentas basura en masa
 * o para tantear qué emails y DNI ya existen (los duplicados responden 409). El margen es más
 * amplio que en el login porque completar mal un formulario largo es normal.
 */
const registroLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de registro. Esperá unos minutos y volvé a probar.' },
});

/**
 * "Olvidé mi contraseña" cuenta TODOS los envíos, no solo los fallidos: el endpoint siempre
 * responde 200 (a propósito, para no revelar qué emails están registrados), así que con
 * `skipSuccessfulRequests` no se limitaría nunca. Nadie legítimo pide 5 reseteos seguidos.
 */
const recuperacionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Ya pediste varios enlaces de recuperación. Revisá tu correo o esperá unos minutos.' },
});

// ── Públicas ──
router.post('/register',        registroLimit, asyncHandler(register));
router.post('/login',           intentosLimit, asyncHandler(login));
router.post('/verify-email',    asyncHandler(verifyEmail));
router.post('/forgot-password', recuperacionLimit, asyncHandler(forgotPassword));
router.post('/reset-password',  asyncHandler(resetPassword));
router.post('/2fa/login',       intentosLimit, asyncHandler(twoFactorLogin));   // 2do paso del login

// ── Autenticadas ──
router.get('/me',                   verifyToken, asyncHandler(me));
router.patch('/perfil',             verifyToken, asyncHandler(actualizarPerfil));
router.patch('/cambiar-password',   verifyToken, asyncHandler(cambiarPassword));
router.post('/resend-verification', verifyToken, asyncHandler(resendVerification));
router.post('/2fa/setup',           verifyToken, asyncHandler(twoFactorSetup));
router.post('/2fa/enable',          verifyToken, asyncHandler(twoFactorEnable));
router.post('/2fa/disable',         verifyToken, asyncHandler(twoFactorDisable));

export default router;
