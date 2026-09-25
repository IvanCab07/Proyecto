// Manejo de fechas de calendarios y formularios.
//
// Espeja web/src/lib/fechas.ts: si cambiás una regla acá, cambiala también allá.
//
// La regla importante: una fecha sin hora se ancla al MEDIODÍA local, nunca a la medianoche.
// `new Date("2026-08-15").toISOString()` se interpreta como medianoche UTC y en Argentina
// (UTC-3) termina guardándose como el 14/08. El backend aplica la misma regla en
// backend/src/lib/fechas.ts.

export const MESES_COMPLETOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * La semana arranca en lunes, como los calendarios de acá. Es el orden de las COLUMNAS de la
 * grilla, y el único lugar donde se define: el componente Calendario es su único consumidor.
 */
export const DIAS_SEMANA_LUNES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** "YYYY-MM-DD" de un Date, en hora local (no usar toISOString: puede correr un día). */
export function claveDeDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** La parte "YYYY-MM-DD" de la fecha que devuelve el backend. */
export function claveFecha(iso: string): string {
  return iso.slice(0, 10);
}

/** Convierte la fecha de un turno en un Date local al mediodía (sin corrimiento de huso). */
export function fechaDeTurno(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function mismaFecha(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** "YYYY-MM-DD" → ISO completo al mediodía local. Es lo que espera el backend. */
export function aISO(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toISOString();
}

/** Hoy en formato "YYYY-MM-DD". */
export function hoyISO(): string {
  return claveDeDia(new Date());
}

/** Mañana en formato "YYYY-MM-DD". El mínimo de las fechas que exigen ser futuras. */
export function mananaISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return claveDeDia(d);
}

/** Hoy + N días en formato "YYYY-MM-DD". Para los presets de vencimiento de recetas. */
export function sumarDiasISO(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return claveDeDia(d);
}

// ── Vencimiento de recetas ──
// El último día cuenta completo: una receta "válida hasta el 20" sirve todo el 20 y recién
// vence el 21. Todas las pantallas tienen que usar estos helpers y no comparar fechas a mano.

/** Umbral en días para avisar que una receta está por vencer. */
export const DIAS_POR_VENCER = 7;

/** Si el vencimiento ya pasó, contando el último día completo. */
export function estaVencida(iso: string): boolean {
  return new Date() > finDelDia(iso);
}

/** Días completos que faltan para el vencimiento. Negativo si ya venció. */
export function diasHastaVencer(iso: string): number {
  const MS_POR_DIA = 86_400_000;
  return Math.ceil((finDelDia(iso).getTime() - Date.now()) / MS_POR_DIA) - 1;
}

export type EstadoReceta = 'vigente' | 'por-vencer' | 'vencida';

/** Estado de una receta según su vencimiento. Fuente única para badges, filtros y contadores. */
export function estadoReceta(iso: string): EstadoReceta {
  if (estaVencida(iso)) return 'vencida';
  return diasHastaVencer(iso) <= DIAS_POR_VENCER ? 'por-vencer' : 'vigente';
}

/** El último instante del día de `iso`, en hora local. */
function finDelDia(iso: string): Date {
  const fin = fechaDeTurno(iso);
  fin.setHours(23, 59, 59, 999);
  return fin;
}
