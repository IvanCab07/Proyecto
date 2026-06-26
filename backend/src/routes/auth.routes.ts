import { Router } from 'express';
import {
  register, login, me, actualizarPerfil, cambiarPassword,
  verifyEmail, resendVerification, forgotPassword, resetPassword,
  twoFactorSetup, twoFactorEnable, twoFactorDisable, twoFactorLogin,
} from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

// ── Públicas ──
router.post('/register',        asyncHandler(register));
router.post('/login',           asyncHandler(login));
router.post('/verify-email',    asyncHandler(verifyEmail));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password',  asyncHandler(resetPassword));
router.post('/2fa/login',       asyncHandler(twoFactorLogin));   // 2do paso del login

// ── Autenticadas ──
router.get('/me',                   verifyToken, asyncHandler(me));
router.patch('/perfil',             verifyToken, asyncHandler(actualizarPerfil));
router.patch('/cambiar-password',   verifyToken, asyncHandler(cambiarPassword));
router.post('/resend-verification', verifyToken, asyncHandler(resendVerification));
router.post('/2fa/setup',           verifyToken, asyncHandler(twoFactorSetup));
router.post('/2fa/enable',          verifyToken, asyncHandler(twoFactorEnable));
router.post('/2fa/disable',         verifyToken, asyncHandler(twoFactorDisable));

export default router;
