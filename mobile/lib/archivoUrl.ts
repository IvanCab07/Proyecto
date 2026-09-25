import { getApiUrl } from '../services/api';

/**
 * URL absoluta de un archivo servido por el backend (estudios, fotos de perfil).
 *
 * El backend guarda rutas relativas ("/uploads/x.jpg") y las sirve con
 * `express.static('uploads')`, que cuelga de la raíz y NO de /api. Por eso hay que sacarle el
 * sufijo /api a la baseURL antes de concatenar.
 *
 * Sale de `getApiUrl()` y no de una constante porque la baseURL la resuelve el autodescubrimiento
 * en el arranque y puede cambiar en runtime: si se leyera una sola vez, los links quedarían
 * apuntando al servidor viejo.
 */
export function urlArchivo(ruta?: string | null): string | undefined {
  if (!ruta) return undefined;
  // Por si alguna vez el backend pasa a devolver URLs absolutas (S3, Cloudinary).
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${getApiUrl().replace(/\/api$/, '')}${ruta}`;
}
