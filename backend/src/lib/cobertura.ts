import { prisma } from './prisma';

export interface CoberturaCalculada {
  /** Obra social del paciente (aunque no cubra este medicamento). null = particular. */
  obraSocial: string | null;
  /** 0-100, o null si no hay cobertura aplicable. */
  porcentaje: number | null;
  /** Por qué no hay cobertura, para mostrarle al médico. */
  motivo?: 'particular' | 'credencial-vencida' | 'sin-catalogo' | 'no-cubre';
}

/**
 * Cuánto le cubre al paciente su obra social un medicamento del catálogo.
 * Fuente única para el preview del médico y para la "foto" que se guarda en la receta.
 *
 * Sin cobertura cuando: el paciente es particular, su credencial está vencida, el medicamento
 * se escribió a mano (no está en el catálogo) o la obra social no lo tiene cargado.
 */
export async function calcularCobertura(
  pacienteId: string,
  medicamentoId: string | null | undefined,
): Promise<CoberturaCalculada> {
  const paciente = await prisma.user.findUnique({
    where: { id: pacienteId },
    select: { obraSocialId: true, vencimientoObraSocial: true, obraSocial: { select: { nombre: true } } },
  });

  if (!paciente?.obraSocialId || !paciente.obraSocial) {
    return { obraSocial: null, porcentaje: null, motivo: 'particular' };
  }
  const obraSocial = paciente.obraSocial.nombre;

  if (paciente.vencimientoObraSocial && paciente.vencimientoObraSocial < new Date()) {
    return { obraSocial, porcentaje: null, motivo: 'credencial-vencida' };
  }
  if (!medicamentoId) return { obraSocial, porcentaje: null, motivo: 'sin-catalogo' };

  const cobertura = await prisma.coberturaMedicamento.findUnique({
    where: { obraSocialId_medicamentoId: { obraSocialId: paciente.obraSocialId, medicamentoId } },
    select: { porcentaje: true },
  });
  if (!cobertura) return { obraSocial, porcentaje: null, motivo: 'no-cubre' };

  return { obraSocial, porcentaje: cobertura.porcentaje };
}
