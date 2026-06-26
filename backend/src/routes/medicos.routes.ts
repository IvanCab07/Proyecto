import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getMedicosDisponibles,
  getMedicosPorEspecialidad,
  getAllMedicos,
  crearMedico,
  actualizarMedico,
  getDisponibilidad,
  eliminarMedico,
} from '../controllers/medicos.controller';

const router = Router();
router.use(verifyToken);

// Pacientes y admins
router.get('/',                              asyncHandler(getMedicosDisponibles));
router.get('/especialidad/:especialidadId',  asyncHandler(getMedicosPorEspecialidad));
router.get('/:id/disponibilidad',            asyncHandler(getDisponibilidad));

// Admin
router.get('/all',      requireAdmin, asyncHandler(getAllMedicos));
router.post('/',        requireAdmin, asyncHandler(crearMedico));
router.patch('/:id',    requireAdmin, asyncHandler(actualizarMedico));
router.delete('/:id',   requireAdmin, asyncHandler(eliminarMedico));

export default router;
