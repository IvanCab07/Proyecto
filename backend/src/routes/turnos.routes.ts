import { Router } from 'express';
import { verifyToken, requireAdmin, requirePatient, requireMedico, requireMedicoOrAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  crearTurno,
  getMisTurnos,
  getAllTurnos,
  getTurnosMedico,
  updateTurnoStatus,
  cancelarTurno,
  getStats,
} from '../controllers/turnos.controller';

const router = Router();

router.use(verifyToken);

// Paciente
router.post('/',           requirePatient, asyncHandler(crearTurno));
router.get('/mis-turnos',  requirePatient, asyncHandler(getMisTurnos));
router.delete('/:id',      requirePatient, asyncHandler(cancelarTurno));

// Médico
router.get('/medico',       requireMedico, asyncHandler(getTurnosMedico));

// Admin
router.get('/stats',        requireAdmin, asyncHandler(getStats));
router.get('/',             requireAdmin, asyncHandler(getAllTurnos));

// Médico (sus turnos) o admin (cualquiera)
router.patch('/:id/status', requireMedicoOrAdmin, asyncHandler(updateTurnoStatus));

export default router;
