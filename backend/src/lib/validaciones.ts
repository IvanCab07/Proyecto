// Piezas de validación reutilizables para los schemas de Zod de los controllers.
// Son la contraparte de web/src/lib/validaciones.ts: si cambiás una regla acá,
// cambiala también allá para que el formulario y la API no se contradigan.
//
// Los mensajes de .regex() son la frase que va DESPUÉS de la etiqueta del campo:
// formatZodError() la antepone ("El nombre" + "solo puede tener letras...").

import { z } from 'zod';

export const LIMITES = {
  nombre: 40,
  apellido: 40,
  telefono: 20,
  matricula: 15,
  especialidad: 50,
  dniMin: 7,
  dniMax: 11,
  // Todas las columnas de texto son VARCHAR(191); sin tope, un email largo entra al schema
  // y explota recién en el INSERT.
  email: 191,
  // `titulo` y `descripcion` de los estudios son VARCHAR(191) como todo el resto: sin un tope
  // en el schema, un título largo pasaba la validación y explotaba recién en el INSERT.
  tituloEstudio: 100,
  descripcionEstudio: 190,
  passwordMin: 8,
  // bcrypt solo mira los primeros 72 bytes de la contraseña y descarta el resto en silencio.
  // Cortar acá evita que alguien crea tener una contraseña más larga de la que realmente vale.
  passwordMax: 72,
} as const;

// Letras (con acentos y ñ) separadas por un único espacio, apóstrofo o guion.
// Acepta "De la Cruz" y "O'Brien"; rechaza números, símbolos y separadores al borde.
export const RE_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Especialidades: igual que los nombres pero sin apóstrofos.
export const RE_ESPECIALIDAD = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ -][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Matrícula profesional: alfanumérica en mayúsculas, admite guiones (MP-12345).
export const RE_MATRICULA = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

// Teléfono: dígitos con separadores habituales y un + opcional al principio.
export const RE_TELEFONO = /^\+?[\d\s()-]+$/;

/** Quita acentos, espacios de los bordes y mayúsculas. Para comparar duplicados. */
export const normalizar = (valor: string): string =>
  valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

export const nombreSchema = z
  .string()
  .trim()
  .min(2)
  .max(LIMITES.nombre)
  .regex(RE_SOLO_LETRAS, 'solo puede tener letras, espacios, apóstrofos y guiones');

export const matriculaSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(4)
  .max(LIMITES.matricula)
  .regex(RE_MATRICULA, 'solo puede tener letras, números y guiones');

export const especialidadNombreSchema = z
  .string()
  .trim()
  .min(3)
  .max(LIMITES.especialidad)
  .regex(RE_ESPECIALIDAD, 'solo puede tener letras, espacios y guiones');

export const dniSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'solo puede tener números')
  .min(LIMITES.dniMin)
  .max(LIMITES.dniMax);

// El email se guarda siempre en minúsculas. MySQL compara sin distinguir mayúsculas, así que
// esto no cambia a quién encuentra el login, pero evita tener "Juan@x.com" y "juan@x.com"
// mezclados en la tabla según cómo lo haya tipeado cada uno al registrarse.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(LIMITES.email);

/**
 * Contraseña nueva (registro, reset, cambio). Para el login alcanza con `.min(1)`: ahí no se
 * valida el formato a propósito, porque las cuentas creadas antes de estas reglas seguirían
 * teniendo contraseñas que no las cumplen y no queremos dejarlas afuera.
 */
export const passwordSchema = z
  .string()
  .min(LIMITES.passwordMin)
  .max(LIMITES.passwordMax)
  .regex(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/, 'debe tener al menos una letra')
  .regex(/\d/, 'debe tener al menos un número');

export const tituloEstudioSchema = z
  .string()
  .trim()
  .min(3)
  .max(LIMITES.tituloEstudio);

// La descripción es opcional: una cadena vacía se trata como "no informada".
export const descripcionEstudioSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().max(LIMITES.descripcionEstudio).optional(),
);

// El teléfono es opcional: una cadena vacía se trata como "no informado".
export const telefonoOpcionalSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z
    .string()
    .trim()
    .max(LIMITES.telefono)
    .regex(RE_TELEFONO, 'solo puede tener números, espacios, guiones, paréntesis y un + inicial')
    .refine((v) => v.replace(/\D/g, '').length >= 7, 'El teléfono debe tener al menos 7 dígitos')
    .optional(),
);
