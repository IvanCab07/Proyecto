import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { HttpError } from '../lib/httpError';

const CARPETA = 'uploads';

fs.mkdirSync(CARPETA, { recursive: true });

// Tope propio, mucho más chico que el de los estudios: una foto de perfil recortada a 512px
// no llega ni cerca. El front además redimensiona antes de subir.
export const MAX_FOTO_MB = 2;

/**
 * Multer aparte del de estudios (`upload.middleware.ts`), que acepta PDF y 10 MB.
 *
 * Va a la MISMA carpeta plana `uploads/` en vez de a `uploads/avatars/`: el helper
 * `borrarArchivo` resuelve la ruta como `path.join('uploads', basename)`, así que una
 * subcarpeta lo dejaría sin encontrar el archivo.
 *
 * El nombre lleva prefijo `avatar-` para poder distinguirlas a simple vista, pero el resto es
 * aleatorio y NO el id del usuario: con un nombre fijo habría que invalidar a mano la caché
 * del <img> de la web y del <Image> de React Native en cada reemplazo.
 */
const storage = multer.diskStorage({
  destination: CARPETA,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${unique}${path.extname(file.originalname)}`);
  },
});

export const uploadImagen = multer({
  storage,
  limits: { fileSize: MAX_FOTO_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    // Rechazar con error (y no con `cb(null, false)`) para que el usuario vea el motivo real:
    // descartándolo en silencio, el controller respondería "Foto requerida", que confunde.
    if (!allowed.includes(file.mimetype)) {
      return cb(new HttpError(400, 'Solo se aceptan imágenes JPG, PNG o WEBP'));
    }
    cb(null, true);
  },
});
