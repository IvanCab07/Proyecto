import fs from 'fs/promises';
import path from 'path';

// Carpeta donde multer guarda todo (estudios y fotos de perfil, plana).
const CARPETA = 'uploads';

/**
 * Borra el archivo físico de `uploads/`. Si ya no está, no pasa nada: lo importante es la fila
 * de la base, no el archivo huérfano.
 *
 * Se queda solo con el `basename` de la URL a propósito: así un valor manipulado del estilo
 * "/uploads/../../.env" no puede salir de la carpeta.
 */
export async function borrarArchivo(archivoUrl: string): Promise<void> {
  try {
    const nombre = path.basename(archivoUrl);
    await fs.unlink(path.join(CARPETA, nombre));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT') {
      console.error('[borrarArchivo]', err instanceof Error ? err.message : err);
    }
  }
}
