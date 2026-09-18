import type { TurnoStatus } from '../services';

// Espejo de backend/src/lib/turnoEstados.ts: si cambiás una transición allá, cambiala acá.
// El front usa esto para ofrecer solo las acciones que el backend va a aceptar; la validación
// de verdad la hace el servidor.

export const ESTADOS_ABIERTOS: TurnoStatus[] = ['PENDIENTE', 'CONFIRMADO'];
export const ESTADOS_CERRADOS: TurnoStatus[] = ['COMPLETADO', 'CANCELADO', 'AUSENTE'];

export const TRANSICIONES: Record<TurnoStatus, TurnoStatus[]> = {
  EN_ESPERA:  ['CONFIRMADO', 'CANCELADO'],
  PENDIENTE:  ['CONFIRMADO', 'CANCELADO', 'AUSENTE'],
  CONFIRMADO: ['COMPLETADO', 'CANCELADO', 'AUSENTE', 'PENDIENTE'],
  COMPLETADO: ['CONFIRMADO', 'PENDIENTE'],
  CANCELADO:  ['PENDIENTE', 'CONFIRMADO'],
  AUSENTE:    ['PENDIENTE', 'CONFIRMADO'],
};

/** Cómo se llama cada estado cuando se lo nombra en una frase. */
export const ETIQUETAS: Record<TurnoStatus, string> = {
  PENDIENTE:  'pendiente',
  CONFIRMADO: 'confirmado',
  CANCELADO:  'cancelado',
  COMPLETADO: 'completado',
  EN_ESPERA:  'en espera',
  AUSENTE:    'ausente',
};

/** Texto del botón que lleva a cada estado. */
export const ACCIONES: Record<TurnoStatus, string> = {
  PENDIENTE:  'Marcar pendiente',
  CONFIRMADO: 'Confirmar',
  CANCELADO:  'Cancelar',
  COMPLETADO: 'Completar',
  EN_ESPERA:  'Poner en espera',
  AUSENTE:    'Marcar ausente',
};

export const esReversion = (desde: TurnoStatus, hacia: TurnoStatus): boolean =>
  ESTADOS_CERRADOS.includes(desde) && ESTADOS_ABIERTOS.includes(hacia);

/** Estados a los que se puede avanzar (flujo normal de atención). */
export const avancesDe = (desde: TurnoStatus): TurnoStatus[] =>
  (TRANSICIONES[desde] ?? []).filter(hacia => !esReversion(desde, hacia));

/** Estados a los que se puede volver (deshacer un estado cargado por error). */
export const reversionesDe = (desde: TurnoStatus): TurnoStatus[] =>
  (TRANSICIONES[desde] ?? []).filter(hacia => esReversion(desde, hacia));
