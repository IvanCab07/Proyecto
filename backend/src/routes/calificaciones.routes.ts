import { Router } from 'express';
import { verifyToken, requireAdmin, requirePatient, requireMedico } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  crearCalificacion,
  getCalificaciones,
  getMisCalificaciones,
} from '../controllers/calificaciones.controller';

const router = Router();
router.use(verifyToken);

// Paciente: calificar un turno completado propio
router.post('/', requirePatient, asyncHandler(crearCalificacion));

// Médico: calificaciones que recibió
router.get('/medico', requireMedico, asyncHandler(getMisCalificaciones));

// Admin: todas las calificaciones + promedio por médico
router.get('/', requireAdmin, asyncHandler(getCalificaciones));

export default router;
