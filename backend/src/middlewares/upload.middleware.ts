import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { HttpError } from '../lib/httpError';

const CARPETA = 'uploads';

// multer no crea el destino: si la carpeta no existe, cada subida falla con ENOENT
fs.mkdirSync(CARPETA, { recursive: true });

// Guarda archivos en uploads/ con nombre único, conservando la extensión original
const storage = multer.diskStorage({
  destination: CARPETA,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// Solo PDF/JPG/PNG, máximo 10MB
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    // Rechazar con error (y no con `cb(null, false)`) para que el usuario vea el motivo real:
    // descartándolo en silencio, el controller respondía "Archivo requerido", que confunde.
    if (!allowed.includes(file.mimetype)) {
      return cb(new HttpError(400, 'Solo se aceptan archivos PDF, JPG o PNG'));
    }
    cb(null, true);
  },
});
