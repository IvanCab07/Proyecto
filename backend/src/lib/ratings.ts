import { prisma } from './prisma';

// Promedios de calificación por médico. Están acá y no en cada controller porque los usan
// el listado de médicos (para que el paciente vea el puntaje al elegir), el panel del médico
// y el ranking del admin, y todos tienen que redondear igual.

export interface RatingMedico {
  promedio: number;  // 0 si todavía no tiene reseñas
  cantidad: number;
}

export const SIN_RATING: RatingMedico = { promedio: 0, cantidad: 0 };

/** Un decimal, como se muestra en la UI (4.25 → 4.3). */
export const redondearPromedio = (valor: number | null): number =>
  Math.round((valor ?? 0) * 10) / 10;

/**
 * Promedio y cantidad por médico. Si se pasan ids, se limita a esos.
 * Los médicos sin reseñas NO aparecen en el mapa: usar `SIN_RATING` como valor por defecto.
 */
export async function ratingsPorMedico(medicoIds?: string[]): Promise<Map<string, RatingMedico>> {
  if (medicoIds && medicoIds.length === 0) return new Map();

  const grupos = await prisma.calificacion.groupBy({
    by: ['medicoId'],
    ...(medicoIds && { where: { medicoId: { in: medicoIds } } }),
    _avg: { estrellas: true },
    _count: { _all: true },
  });

  return new Map(
    grupos.map(g => [
      g.medicoId,
      { promedio: redondearPromedio(g._avg.estrellas), cantidad: g._count._all },
    ]),
  );
}

/** Agrega `promedio` y `cantidad` a una lista de médicos, con 0/0 para los que no tienen reseñas. */
export async function conRating<T extends { id: string }>(
  medicos: T[],
): Promise<(T & RatingMedico)[]> {
  const ratings = await ratingsPorMedico(medicos.map(m => m.id));
  return medicos.map(m => ({ ...m, ...(ratings.get(m.id) ?? SIN_RATING) }));
}
