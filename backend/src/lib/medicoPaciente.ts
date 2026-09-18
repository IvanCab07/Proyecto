import { prisma } from './prisma';
import { HttpError } from './httpError';

// Un médico solo puede ver y tocar datos de pacientes que pasaron por su agenda.
// Estos helpers centralizan ese chequeo para que no se repita en cada controller.

/** Ficha de médico del usuario logueado. Lanza 403 si la cuenta no está vinculada. */
export async function fichaDelMedico(userId: string): Promise<{ id: string }> {
  const medico = await prisma.medico.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!medico) throw new HttpError(403, 'Tu cuenta no está vinculada a una ficha de médico');
  return medico;
}

/**
 * Verifica que el paciente tenga (o haya tenido) al menos un turno con el médico logueado.
 * Lanza 403 si no hay relación. Devuelve el id de la ficha del médico, que casi siempre
 * hace falta a continuación.
 */
export async function assertPacienteDelMedico(userId: string, pacienteId: string): Promise<string> {
  const medico = await fichaDelMedico(userId);

  const turno = await prisma.turno.findFirst({
    where: { medicoId: medico.id, pacienteId },
    select: { id: true },
  });
  if (!turno) throw new HttpError(403, 'Ese paciente no está en tu agenda');

  return medico.id;
}
