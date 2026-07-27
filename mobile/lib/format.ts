// Helpers de formato/fecha en es-AR (centraliza lo que estaba duplicado inline).

export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Los nombres de los días viven en lib/fechas.ts como DIAS_SEMANA_LUNES (la semana arranca en
// lunes, que es como se arman los calendarios de acá). Antes había acá un DIAS_SEMANA que
// empezaba en domingo y los dos calendarios de la app mostraban semanas distintas.

export function formatFecha(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatFechaCorta(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatFechaLarga(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function saludo(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export function iniciales(nombre?: string, apellido?: string): string {
  return `${(nombre?.[0] ?? '').toUpperCase()}${(apellido?.[0] ?? '').toUpperCase()}` || '?';
}
