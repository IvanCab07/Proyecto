import { ZodError, ZodIssue } from 'zod';

// Error con status HTTP explícito. Lanzalo desde un controller y el error handler
// global de index.ts lo responde como { error: <message> } con ese status.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

// Etiquetas en español para los campos que validamos con Zod
const LABELS: Record<string, string> = {
  email: 'El email',
  password: 'La contraseña',
  nombre: 'El nombre',
  apellido: 'El apellido',
  dni: 'El DNI',
  telefono: 'El teléfono',
  matricula: 'La matrícula',
  especialidadId: 'La especialidad',
  medicoId: 'El médico',
  pacienteId: 'El paciente',
  fecha: 'La fecha',
  hora: 'La hora',
  medicamento: 'El medicamento',
  dosis: 'La dosis',
  indicacion: 'La indicación',
  motivo: 'El motivo',
  role: 'El rol',
  passwordActual: 'La contraseña actual',
  passwordNueva: 'La nueva contraseña',
  validoHasta: 'La validez',
};

function labelFor(issue: ZodIssue): string {
  const field = String(issue.path[0] ?? '');
  return LABELS[field] ?? (field || 'El dato');
}

// Convierte un issue de Zod en una frase clara en español
function issueMessage(issue: ZodIssue): string {
  const label = labelFor(issue);
  switch (issue.code) {
    case 'too_small':
      if (issue.type === 'string') {
        return issue.minimum === 1
          ? `${label} es obligatorio`
          : `${label} debe tener al menos ${issue.minimum} caracteres`;
      }
      return `${label} es demasiado chico`;
    case 'too_big':
      if (issue.type === 'string') return `${label} debe tener como máximo ${issue.maximum} caracteres`;
      return `${label} es demasiado grande`;
    case 'invalid_string':
      if (issue.validation === 'email') return 'El email no tiene un formato válido';
      if (issue.validation === 'uuid') return `${label} no es válido`;
      if (issue.validation === 'datetime') return `${label} no es una fecha válida`;
      if (issue.validation === 'regex') return `${label} tiene un formato inválido`;
      return `${label} no es válido`;
    case 'invalid_type':
      return issue.received === 'undefined' ? `${label} es obligatorio` : `${label} no es válido`;
    case 'invalid_enum_value':
      return `${label} no es una opción válida`;
    default:
      return issue.message;
  }
}

// Junta todos los issues en un único string legible (sin repetidos)
export function formatZodError(err: ZodError): string {
  const msgs = err.issues.map(issueMessage);
  return [...new Set(msgs)].join('. ');
}

// Mensaje amable según el campo único que chocó (Prisma P2002)
export function uniqueFieldMessage(target: unknown): string {
  const t = Array.isArray(target) ? target.join(',') : String(target ?? '');
  if (t.includes('email')) return 'Ese email ya está registrado';
  if (t.includes('dni')) return 'Ese DNI ya está registrado';
  if (t.includes('matricula')) return 'Esa matrícula ya está registrada';
  if (t.includes('userId')) return 'Ese usuario ya tiene una ficha de médico';
  if (t.includes('nombre')) return 'Ya existe un registro con ese nombre';
  return 'Ya existe un registro con esos datos';
}
