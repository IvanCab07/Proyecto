import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import { uploadEstudio, getMisEstudios, getEstudiosPaciente } from '../controllers/estudios.controller';

const router = Router();
router.use(verifyToken);

router.post('/upload', upload.single('archivo'), asyncHandler(uploadEstudio));
router.get('/mis-estudios',                      asyncHandler(getMisEstudios));
router.get('/paciente/:pacienteId', requireAdmin, asyncHandler(getEstudiosPaciente));

export default router;
