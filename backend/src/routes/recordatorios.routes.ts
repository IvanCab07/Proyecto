import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getMisRecordatorios,
  getTomasHoy,
  actualizarHorarios,
  registrarToma,
  crearRecordatorioManual,
  toggleActivo,
} from '../controllers/recordatorios.controller';

const router = Router();
router.use(verifyToken);

router.get('/',                    asyncHandler(getMisRecordatorios));
router.get('/hoy',                 asyncHandler(getTomasHoy));
router.post('/',                   asyncHandler(crearRecordatorioManual));
router.patch('/:id/horarios',      asyncHandler(actualizarHorarios));
router.post('/:id/tomas',          asyncHandler(registrarToma));
router.patch('/:id/activo',        asyncHandler(toggleActivo));

export default router;
