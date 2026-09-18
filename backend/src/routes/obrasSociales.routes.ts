import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import { getObrasSociales, crearObraSocial } from '../controllers/obrasSociales.controller';

const router = Router();
router.use(verifyToken);

router.get('/',                    asyncHandler(getObrasSociales));
router.post('/',     requireAdmin, asyncHandler(crearObraSocial));

export default router;