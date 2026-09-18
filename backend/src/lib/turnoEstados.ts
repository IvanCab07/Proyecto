// Reglas de cambio de estado de un turno.
//
// Antes cualquier estado podía pasar a cualquier otro: se podía "descompletar" un turno ya
// calificado, o reactivar uno cancelado cuyo horario ya se le había cedido a un sobreturno.
// Acá quedan declaradas las transiciones válidas, en un solo lugar, para que el backend las
// aplique y el front pueda ofrecer exactamente las mismas opciones.

export type TurnoStatus =
  | 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO' | 'EN_ESPERA' | 'AUSENTE';

/** Estados "abiertos": el turno todavía se va a atender y ocupa el horario. */
export const ESTADOS_ABIERTOS: TurnoStatus[] = ['PENDIENTE', 'CONFIRMADO'];

/** Estados "cerrados": el turno ya terminó (bien o mal). Salir de acá es deshacer. */
export const ESTADOS_CERRADOS: TurnoStatus[] = ['COMPLETADO', 'CANCELADO', 'AUSENTE'];

/** A qué estados se puede pasar desde cada estado. */
export const TRANSICIONES: Record<TurnoStatus, TurnoStatus[]> = {
  EN_ESPERA:  ['CONFIRMADO', 'CANCELADO'],
  PENDIENTE:  ['CONFIRMADO', 'CANCELADO', 'AUSENTE'],
  CONFIRMADO: ['COMPLETADO', 'CANCELADO', 'AUSENTE', 'PENDIENTE'],
  // Deshacer: por si el médico marcó el estado equivocado
  COMPLETADO: ['CONFIRMADO', 'PENDIENTE'],
  CANCELADO:  ['PENDIENTE', 'CONFIRMADO'],
  AUSENTE:    ['PENDIENTE', 'CONFIRMADO'],
};

/** Nombre legible del estado, para los mensajes de error y las notificaciones. */
export const ETIQUETAS: Record<TurnoStatus, string> = {
  PENDIENTE:  'pendiente',
  CONFIRMADO: 'confirmado',
  CANCELADO:  'cancelado',
  COMPLETADO: 'completado',
  EN_ESPERA:  'en espera',
  AUSENTE:    'ausente',
};

export const puedeTransicionar = (desde: TurnoStatus, hacia: TurnoStatus): boolean =>
  TRANSICIONES[desde]?.includes(hacia) ?? false;

/** Volver de un estado cerrado a uno abierto es "deshacer", y pide chequeos extra. */
export const esReversion = (desde: TurnoStatus, hacia: TurnoStatus): boolean =>
  ESTADOS_CERRADOS.includes(desde) && ESTADOS_ABIERTOS.includes(hacia);
