import type { TurnoStatus } from '../services';

// Solo las etiquetas: el panel de transiciones (TRANSICIONES/avancesDe/reversionesDe de
// web/src/lib/turnoEstados.ts) vive en la agenda del médico y en mobile lo resuelve el
// `NEXT` local de app/medico/(tabs)/agenda.tsx. Acá alcanza con saber cómo se nombra
// cada estado dentro de una frase, que es lo que necesita el asistente.

/** Cómo se llama cada estado cuando se lo nombra en una frase. */
export const ETIQUETAS: Record<TurnoStatus, string> = {
  PENDIENTE:  'pendiente',
  CONFIRMADO: 'confirmado',
  CANCELADO:  'cancelado',
  COMPLETADO: 'completado',
  EN_ESPERA:  'en espera',
  AUSENTE:    'ausente',
};
