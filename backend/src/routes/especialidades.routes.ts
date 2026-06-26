import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getEspecialidades,
  crearEspecialidad,
  actualizarEspecialidad,
  eliminarEspecialidad,
} from '../controllers/especialidades.controller';

const router = Router();
router.use(verifyToken);

router.get('/',                    asyncHandler(getEspecialidades));
router.post('/',     requireAdmin, asyncHandler(crearEspecialidad));
router.patch('/:id', requireAdmin, asyncHandler(actualizarEspecialidad));
router.delete('/:id', requireAdmin, asyncHandler(eliminarEspecialidad));

export default router;
