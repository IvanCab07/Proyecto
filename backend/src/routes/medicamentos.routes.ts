import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import { getMedicamentos, crearMedicamento, eliminarMedicamento } from '../controllers/medicamentos.controller';

const router = Router();
router.use(verifyToken);

router.get('/',                      asyncHandler(getMedicamentos));
router.post('/',       requireAdmin, asyncHandler(crearMedicamento));
router.delete('/:id',  requireAdmin, asyncHandler(eliminarMedicamento));

export default router;
