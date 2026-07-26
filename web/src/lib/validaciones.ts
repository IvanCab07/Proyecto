// Reglas de validación de los formularios del panel.
// Los mismos límites y expresiones viven en backend/src/lib/validaciones.ts: si cambiás
// una regla acá, cambiala también allá para que el front y la API no se contradigan.
//
// Cada validador devuelve el mensaje de error, o undefined si el valor es válido.
// Ese string se pasa tal cual a la prop `error` de <Input>/<Select>, que ya lo muestra.

export const LIMITES = {
  nombre: 40,
  apellido: 40,
  telefono: 20,
  matricula: 15,
  especialidad: 50,
  dniMin: 7,
  dni: 11,
  // Todas las columnas de texto son VARCHAR(191).
  email: 191,
  passwordMin: 8,
  // bcrypt solo mira los primeros 72 bytes: más allá de eso los caracteres se descartan
  // en silencio y la contraseña no es la que el usuario cree haber puesto.
  password: 72,
  medicamento: 80,
  dosis: 80,
  indicacion: 500,
  // Los estudios: `titulo` y `descripcion` son VARCHAR(191) como el resto de las columnas.
  tituloEstudio: 100,
  descripcionEstudio: 190,
} as const;

// Letras (con acentos y ñ) separadas por un único espacio, apóstrofo o guion.
// Acepta "De la Cruz" y "O'Brien"; rechaza números, símbolos y separadores al borde.
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Especialidades: igual que los nombres pero sin apóstrofos ("Clínica médica", "Gineco-obstetricia").
const NOMBRE_ESPECIALIDAD = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ -][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Matrícula profesional: alfanumérica en mayúsculas, admite guiones (MP-12345).
const MATRICULA = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

// Teléfono: dígitos con separadores habituales y un + opcional al principio.
const TELEFONO = /^\+?[\d\s()-]+$/;

const SOLO_DIGITOS = /^\d+$/;

// Para las reglas de contraseña: al menos una letra (con acentos) y al menos un número.
const LETRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const DIGITO = /\d/;

// Marcas diacríticas que deja `normalize('NFD')` al separar los acentos de la letra base.
const DIACRITICOS = /[\u0300-\u036f]/g;

/** Quita acentos, espacios de los bordes y mayúsculas. Para comparar duplicados. */
export function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(DIACRITICOS, '').trim().toLowerCase();
}

/** Devuelve el mapa de errores sin el campo indicado. Para limpiar mientras se escribe. */
export function sinError(errores: Record<string, string>, campo: string): Record<string, string> {
  const resto = { ...errores };
  delete resto[campo];
  return resto;
}

/** Colapsa espacios repetidos y recorta. Lo que se manda al backend. */
export function limpiar(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

export function validarNombre(valor: string, etiqueta = 'El nombre'): string | undefined {
  const v = limpiar(valor);
  if (!v) return `${etiqueta} es obligatorio`;
  if (v.length < 2) return `${etiqueta} debe tener al menos 2 caracteres`;
  if (v.length > LIMITES.nombre) return `${etiqueta} no puede superar los ${LIMITES.nombre} caracteres`;
  if (!SOLO_LETRAS.test(v)) return `${etiqueta} solo puede tener letras, espacios, apóstrofos y guiones`;
  return undefined;
}

/** El teléfono es opcional: vacío es válido. */
export function validarTelefono(valor: string): string | undefined {
  const v = valor.trim();
  if (!v) return undefined;
  if (v.length > LIMITES.telefono) return `El teléfono no puede superar los ${LIMITES.telefono} caracteres`;
  if (!TELEFONO.test(v)) return 'El teléfono solo puede tener números, espacios, guiones, paréntesis y un + inicial';
  const digitos = v.replace(/\D/g, '').length;
  if (digitos < 7) return 'El teléfono debe tener al menos 7 dígitos';
  return undefined;
}

export function validarMatricula(valor: string): string | undefined {
  const v = valor.trim().toUpperCase();
  if (!v) return 'La matrícula es obligatoria';
  if (v.length < 4) return 'La matrícula debe tener al menos 4 caracteres';
  if (v.length > LIMITES.matricula) return `La matrícula no puede superar los ${LIMITES.matricula} caracteres`;
  if (!MATRICULA.test(v)) return 'La matrícula solo puede tener letras, números y guiones';
  return undefined;
}

export function validarEspecialidad(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'El nombre es obligatorio';
  if (v.length < 3) return 'El nombre debe tener al menos 3 caracteres';
  if (v.length > LIMITES.especialidad) return `El nombre no puede superar los ${LIMITES.especialidad} caracteres`;
  if (!NOMBRE_ESPECIALIDAD.test(v)) return 'El nombre solo puede tener letras, espacios y guiones';
  return undefined;
}

export function validarDni(valor: string): string | undefined {
  const v = valor.trim();
  if (!v) return 'El DNI es obligatorio';
  if (!SOLO_DIGITOS.test(v)) return 'El DNI solo puede tener números';
  if (v.length < LIMITES.dniMin) return `El DNI debe tener al menos ${LIMITES.dniMin} dígitos`;
  if (v.length > LIMITES.dni) return `El DNI no puede superar los ${LIMITES.dni} dígitos`;
  return undefined;
}

export function validarEmail(valor: string): string | undefined {
  const v = valor.trim();
  if (!v) return 'El email es obligatorio';
  if (v.length > LIMITES.email) return `El email no puede superar los ${LIMITES.email} caracteres`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Ingresá un email válido';
  return undefined;
}

/**
 * Contraseña nueva (registro, reset, cambio). En el login no se valida el formato: las cuentas
 * creadas antes de estas reglas seguirían sin cumplirlas y quedarían afuera de su propia cuenta.
 */
export function validarPassword(valor: string): string | undefined {
  if (!valor) return 'La contraseña es obligatoria';
  // Una contraseña de puros espacios pasa el chequeo de largo pero es imposible de retipear.
  if (!valor.trim()) return 'La contraseña no puede ser solo espacios';
  if (valor.length < LIMITES.passwordMin) return `La contraseña debe tener al menos ${LIMITES.passwordMin} caracteres`;
  if (valor.length > LIMITES.password) return `La contraseña no puede superar los ${LIMITES.password} caracteres`;
  if (!LETRA.test(valor)) return 'La contraseña debe tener al menos una letra';
  if (!DIGITO.test(valor)) return 'La contraseña debe tener al menos un número';
  return undefined;
}

/**
 * Fuerza de la contraseña, de 0 a 3. Es solo una señal visual para el medidor: la regla que
 * decide si se acepta o no es `validarPassword`, no esto.
 */
export function fuerzaPassword(valor: string): 0 | 1 | 2 | 3 {
  if (valor.length < LIMITES.passwordMin) return 0;

  let puntos = 0;
  if (valor.length >= 12) puntos++;
  if (LETRA.test(valor) && DIGITO.test(valor)) puntos++;
  if (/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\d]/.test(valor)) puntos++;

  return Math.min(puntos, 3) as 0 | 1 | 2 | 3;
}

/** Que la repetición coincida con la contraseña nueva. */
export function validarConfirmacion(password: string, confirmacion: string): string | undefined {
  if (!confirmacion) return 'Repetí la contraseña';
  if (password !== confirmacion) return 'Las contraseñas no coinciden';
  return undefined;
}

/** Deja solo lo que puede ir en una matrícula, en mayúsculas. Para usar en onChange. */
export function formatearMatricula(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, LIMITES.matricula);
}

/** Deja solo dígitos, recortado al largo máximo. Para usar en el onChange del DNI. */
export function formatearDni(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, LIMITES.dni);
}

/**
 * Deja solo lo que puede ir en un teléfono, recortado al largo máximo. Para usar en el onChange.
 * El `+` solo vale al principio, así que se conserva únicamente si es el primer carácter.
 */
export function formatearTelefono(valor: string): string {
  const masInicial = valor.startsWith('+') ? '+' : '';
  const resto = valor.replace(/[^\d\s()-]/g, '');
  return (masInicial + resto).slice(0, LIMITES.telefono);
}

// ── Recetas ──
// Los mínimos coinciden con el recetaSchema de backend/src/controllers/recetas.controller.ts:
// validando acá, el médico ve el problema en el campo en vez de recibir un 400 al enviar.

export function validarMedicamento(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'El medicamento es obligatorio';
  if (v.length < 2) return 'El medicamento debe tener al menos 2 caracteres';
  if (v.length > LIMITES.medicamento) return `El medicamento no puede superar los ${LIMITES.medicamento} caracteres`;
  return undefined;
}

export function validarDosis(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'La dosis es obligatoria';
  if (v.length > LIMITES.dosis) return `La dosis no puede superar los ${LIMITES.dosis} caracteres`;
  return undefined;
}

export function validarIndicacion(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'La indicación es obligatoria';
  if (v.length < 5) return 'La indicación debe tener al menos 5 caracteres';
  if (v.length > LIMITES.indicacion) return `La indicación no puede superar los ${LIMITES.indicacion} caracteres`;
  return undefined;
}

// ── Estudios ──
// Los mismos límites que el metadatosSchema de backend/src/controllers/estudios.controller.ts.

export function validarTituloEstudio(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return 'El título es obligatorio';
  if (v.length < 3) return 'El título debe tener al menos 3 caracteres';
  if (v.length > LIMITES.tituloEstudio) return `El título no puede superar los ${LIMITES.tituloEstudio} caracteres`;
  return undefined;
}

/** La descripción es opcional: vacía es válida. */
export function validarDescripcionEstudio(valor: string): string | undefined {
  const v = limpiar(valor);
  if (!v) return undefined;
  if (v.length > LIMITES.descripcionEstudio) {
    return `La descripción no puede superar los ${LIMITES.descripcionEstudio} caracteres`;
  }
  return undefined;
}

/**
 * Vencimiento de la receta: obligatorio y posterior a hoy. Una receta que vence hoy mismo o
 * antes no le sirve al paciente, y una sin vencimiento quedaba vigente para siempre.
 */
export function validarFechaValidez(valor: string): string | undefined {
  const v = valor.trim();
  if (!v) return 'La fecha de vencimiento es obligatoria';

  const fecha = new Date(`${v}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return 'Ingresá una fecha válida';

  const finDeHoy = new Date();
  finDeHoy.setHours(23, 59, 59, 999);
  if (fecha <= finDeHoy) return 'La fecha tiene que ser posterior a hoy';

  return undefined;
}
