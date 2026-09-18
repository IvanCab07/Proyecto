import { Router } from 'express';
import { verifyToken, requireAdmin, requireMedico } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getMedicosDisponibles,
  getMedicosPorEspecialidad,
  getAllMedicos,
  crearMedico,
  actualizarMedico,
  getDisponibilidad,
  eliminarMedico,
  getMiFichaMedico,
  actualizarMiDisponibilidad,
} from '../controllers/medicos.controller';

const router = Router();
router.use(verifyToken);

// Médico: su propia ficha y disponibilidad (van antes de '/:id' para no chocar)
router.get('/mi-ficha',            requireMedico, asyncHandler(getMiFichaMedico));
router.patch('/mi-disponibilidad', requireMedico, asyncHandler(actualizarMiDisponibilidad));

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
