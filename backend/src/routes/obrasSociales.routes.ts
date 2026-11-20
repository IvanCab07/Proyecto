import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getObrasSociales, crearObraSocial, getCoberturas, guardarCobertura, eliminarCobertura,
} from '../controllers/obrasSociales.controller';

const router = Router();
router.use(verifyToken);

router.get('/',                    asyncHandler(getObrasSociales));
router.post('/',     requireAdmin, asyncHandler(crearObraSocial));

// Coberturas de medicamentos de cada obra social
router.get('/:id/coberturas',                              asyncHandler(getCoberturas));
router.put('/:id/coberturas/:medicamentoId',    requireAdmin, asyncHandler(guardarCobertura));
router.delete('/:id/coberturas/:medicamentoId', requireAdmin, asyncHandler(eliminarCobertura));

export default router;
