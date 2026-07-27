// Redimensionado de imágenes en el navegador, sin dependencias.
//
// El backend acepta hasta 2 MB para la foto de perfil. En vez de rechazar la foto de 8 MP que
// sale de cualquier celular, la recortamos y comprimimos acá: así el 413 no puede pasar y de
// paso no llenamos el disco del servidor con imágenes gigantes que se muestran a 64px.
//
// (sharp es devDependency de web/, pero corre en Node para los scripts de assets; en el browser
// no sirve. Canvas alcanza y no suma nada al bundle.)

/** Lado del cuadrado de salida. 512 es holgado para un avatar en pantallas retina. */
const LADO_POR_DEFECTO = 512;
const CALIDAD_JPEG = 0.85;

/**
 * Recorta la imagen al cuadrado centrado más grande que entre y la reescala a `lado` px.
 * Devuelve siempre un JPEG.
 */
export async function redimensionarImagen(file: File, lado = LADO_POR_DEFECTO): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  try {
    // Cuadrado centrado: el lado más corto manda, así no se deforma nada.
    const corte = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - corte) / 2;
    const sy = (bitmap.height - corte) / 2;
    // Nunca agrandamos: si la original es más chica que `lado`, se deja como está.
    const destino = Math.min(lado, corte);

    const canvas = document.createElement('canvas');
    canvas.width = destino;
    canvas.height = destino;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('El navegador no pudo procesar la imagen');

    ctx.drawImage(bitmap, sx, sy, corte, corte, 0, 0, destino, destino);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))),
        'image/jpeg',
        CALIDAD_JPEG,
      );
    });
  } finally {
    bitmap.close();
  }
}
