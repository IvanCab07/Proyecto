// Reglas de validación de los formularios de la app.
//
// Es el subconjunto de web/src/lib/validaciones.ts que usa mobile. Los mismos límites viven en
// backend/src/lib/validaciones.ts: si cambiás una regla acá, cambiala en los tres lados.
//
// Cada validador devuelve el mensaje de error, o undefined si el valor es válido. Ese string
// se pasa tal cual a la prop `error` de <Input>/<Textarea>, que ya lo muestra.

export const LIMITES = {
  medicamento: 80,
  dosis: 80,
  indicacion: 500,
  tituloEstudio: 100,
  descripcionEstudio: 190,
} as const;

// Marcas diacríticas que deja `normalize('NFD')` al separar los acentos de la letra base.
const DIACRITICOS = /[\u0300-\u036f]/g;

/** Quita acentos, espacios de los bordes y mayúsculas. Para comparar y buscar. */
export function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(DIACRITICOS, '').trim().toLowerCase();
}

/** Colapsa espacios repetidos y recorta. Lo que se manda al backend. */
export function limpiar(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

// ── Recetas ──
// Los mínimos coinciden con el recetaSchema de backend/src/controllers/recetas.controller.ts:
// validando acá, el médico ve el problema en el campo en vez de recibir un 400 al enviar.

export function validarMedicamento(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'El medicamento es obligatorio';
  if (v.length < 2) return 'El medicamento debe tener al menos 2 caracteres';
  if (v.length > LIMITES.medicamento) return `El medicamento no puede superar los ${LIMITES.medicamento} caracteres`;
  return undefined;
}

export function validarDosis(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'La dosis es obligatoria';
  if (v.length > LIMITES.dosis) return `La dosis no puede superar los ${LIMITES.dosis} caracteres`;
  return undefined;
}

export function validarIndicacion(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'La indicación es obligatoria';
  if (v.length < 5) return 'La indicación debe tener al menos 5 caracteres';
  if (v.length > LIMITES.indicacion) return `La indicación no puede superar los ${LIMITES.indicacion} caracteres`;
  return undefined;
}

/**
 * Vencimiento de la receta: obligatorio y posterior a hoy. Una receta que vence hoy mismo o
 * antes no le sirve al paciente, y una sin vencimiento quedaría vigente para siempre.
 */
export function validarFechaValidez(valor: string): string | undefined {
  const v = valor.trim();
  if (!v) return 'La fecha de vencimiento es obligatoria';

  const fecha = new Date(`${v}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return 'Ingresá una fecha válida';

  const finDeHoy = new Date();
  finDeHoy.setHours(23, 59, 59, 999);
  if (fecha <= finDeHoy) return 'La fecha tiene que ser posterior a hoy';

  return undefined;
}

// ── Estudios ──
// Los mismos límites que el metadatosSchema de backend/src/controllers/estudios.controller.ts.

export function validarTituloEstudio(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'El título es obligatorio';
  if (v.length < 3) return 'El título debe tener al menos 3 caracteres';
  if (v.length > LIMITES.tituloEstudio) return `El título no puede superar los ${LIMITES.tituloEstudio} caracteres`;
  return undefined;
}

/** La descripción es opcional: vacía es válida. */
export function validarDescripcionEstudio(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return undefined;
  if (v.length > LIMITES.descripcionEstudio) {
    return `La descripción no puede superar los ${LIMITES.descripcionEstudio} caracteres`;
  }
  return undefined;
}
