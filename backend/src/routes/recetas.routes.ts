import { Router } from 'express';
import { verifyToken, requireMedico, requireMedicoOrAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import { getMisRecetas, getRecetasMedico, crearReceta, eliminarReceta } from '../controllers/recetas.controller';

const router = Router();
router.use(verifyToken);

router.get('/mis-recetas',           asyncHandler(getMisRecetas));
router.get('/medico', requireMedico, asyncHandler(getRecetasMedico));
router.post('/', requireMedicoOrAdmin, asyncHandler(crearReceta));
router.delete('/:id', requireMedicoOrAdmin, asyncHandler(eliminarReceta));

export default router;
