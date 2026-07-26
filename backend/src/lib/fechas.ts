// Parseo de las fechas que llegan desde los formularios.
//
// Los <input type="date"> del front mandan "YYYY-MM-DD" (sin hora), mientras que otras
// pantallas mandan un ISO-8601 completo. Acá se aceptan las dos formas y se devuelve
// siempre un Date, así ningún endpoint tiene que adivinar el formato.
//
// Las fechas sin hora se anclan al MEDIODÍA local a propósito: `new Date("2026-08-15")`
// se interpreta como medianoche UTC y en Argentina (UTC-3) termina mostrándose como el
// 14/08. Con el mediodía, la fecha sigue siendo la misma en cualquier huso razonable.

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Convierte "YYYY-MM-DD" o un ISO completo en Date. Devuelve null si no es una fecha válida. */
export function fechaDeEntrada(valor: string): Date | null {
  const v = valor.trim();
  if (!v) return null;

  const fecha = SOLO_FECHA.test(v) ? new Date(`${v}T12:00:00`) : new Date(v);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Hoy a las 23:59:59.999 (hora local). Todo lo que sea <= a esto es "hoy o antes". */
export function finDeHoy(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Suma días a una fecha y ancla el resultado al mediodía local, igual que `fechaDeEntrada`.
 * Se usa para completar el vencimiento de una receta cuando el emisor no lo manda.
 */
export function sumarDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  d.setHours(12, 0, 0, 0);
  return d;
}
