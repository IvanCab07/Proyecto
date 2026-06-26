import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getPacientes,
  getHistorialPaciente,
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  resetPassword,
  eliminarUsuario,
} from '../controllers/users.controller';

const router = Router();
router.use(verifyToken, requireAdmin);

// Compat: lista de pacientes (la usan Pacientes/Historial)
router.get('/',              asyncHandler(getPacientes));
router.get('/:id/historial', asyncHandler(getHistorialPaciente));

// Gestión de cuentas (admin): todas las cuentas + alta/edición/baja
router.get('/todos',                asyncHandler(getUsuarios));
router.post('/',                    asyncHandler(crearUsuario));
router.patch('/:id',                asyncHandler(actualizarUsuario));
router.post('/:id/reset-password',  asyncHandler(resetPassword));
router.delete('/:id',               asyncHandler(eliminarUsuario));

export default router;
