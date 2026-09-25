// Catálogo de temas del asistente de soporte y el buscador que elige cuál responder.
//
// NO hay IA acá: es un índice de palabras clave sobre un catálogo escrito a mano. Se eligió
// así a propósito — no necesita API key, no cuesta por mensaje, responde al instante y nunca
// se inventa una respuesta, que en un contexto de salud es lo que importa. El precio es que
// solo sabe de los temas que están en TEMAS: cuando no encuentra ninguno, lo dice y sugiere
// los más parecidos en vez de improvisar.
//
// Espeja web/src/lib/asistente.ts, con dos diferencias que NO hay que "corregir" copiando:
//   1. Las rutas son las de expo-router (/patient/*), no las de react-router (/paciente/*).
//   2. Los textos describen la app, no la web. La web tiene impresión de recetas, filtros y
//      drag & drop que en el celular no existen; si se copian tal cual, el asistente manda al
//      usuario a tocar botones que no están, que es peor que no contestar.
// Si agregás un tema allá, agregalo acá — y revisá que el texto describa esta pantalla.

import { normalizar } from './validaciones';
import { formatFecha, formatFechaLarga } from './format';
import { estadoReceta, diasHastaVencer, DIAS_POR_VENCER } from './fechas';
import { ETIQUETAS } from './turnoEstados';
import type { Turno, Receta, Estudio } from '../services';

export type Categoria = 'turnos' | 'recetas' | 'estudios' | 'cuenta' | 'centros';

export interface Accion {
  label: string;
  to: string;
}

export interface Respuesta {
  texto: string;
  acciones?: Accion[];
}

export interface ContextoPaciente {
  nombre?: string;
  turnos: Turno[];
  recetas: Receta[];
  estudios: Estudio[];
}

export interface Tema {
  id: string;
  /** Cómo se lista en el menú de sugerencias. */
  titulo: string;
  categoria: Categoria;
  /** Sinónimos y formas en que alguien podría preguntar por esto. */
  palabras: string[];
  responder: (ctx: ContextoPaciente) => Respuesta;
}

export const CATEGORIAS: Record<Categoria, string> = {
  turnos: 'Turnos',
  recetas: 'Recetas',
  estudios: 'Estudios',
  cuenta: 'Mi cuenta',
  centros: 'Centros',
};

// ── Helpers sobre el contexto ──

const ESTADOS_VIGENTES = ['PENDIENTE', 'CONFIRMADO', 'EN_ESPERA'];

/** El próximo turno que todavía no pasó, o null. Mismo criterio que la pantalla de Inicio. */
function proximoTurno(turnos: Turno[]): Turno | null {
  const hoy = new Date().toISOString().slice(0, 10);
  const proximos = turnos
    .filter(t => t.fecha.slice(0, 10) >= hoy && ESTADOS_VIGENTES.includes(t.status))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
  return proximos[0] ?? null;
}

function describirTurno(t: Turno): string {
  // Sin "Dr."/"Dra.": no guardamos el género del profesional, y deducirlo del nombre le
  // erraría a una parte del plantel. El nombre y la especialidad alcanzan para identificarlo.
  const medico = t.medico ? ` con ${t.medico.nombre} ${t.medico.apellido}` : '';
  const especialidad = t.medico?.especialidad?.nombre ? ` (${t.medico.especialidad.nombre})` : '';
  return `el ${formatFechaLarga(t.fecha)} a las ${t.hora} hs${medico}${especialidad}`;
}

/** Pluraliza sin repetir el ternario en cada respuesta. */
const plural = (n: number, singular: string, plural: string) =>
  n === 1 ? `1 ${singular}` : `${n} ${plural}`;

// ── El catálogo ──

export const TEMAS: Tema[] = [
  // ── Turnos ──
  {
    id: 'sacar-turno',
    titulo: '¿Cómo saco un turno?',
    categoria: 'turnos',
    palabras: ['sacar', 'pedir', 'reservar', 'solicitar', 'turno', 'cita', 'agendar', 'nuevo', 'atenderme', 'consulta'],
    responder: () => ({
      texto: 'Tocá el botón central "+" y seguí los tres pasos: especialidad y médico, después fecha y horario, y al final confirmás. Te queda registrado y lo vas a ver en "Mis turnos".',
      acciones: [{ label: 'Solicitar turno', to: '/patient/solicitar' }],
    }),
  },
  {
    id: 'proximo-turno',
    titulo: '¿Cuándo es mi próximo turno?',
    categoria: 'turnos',
    // Ojo con las frases genéricas: "mi turno" aparece en casi cualquier pregunta sobre
    // turnos ("necesito cancelar mi turno") y se llevaba puestos a los otros temas. Las
    // frases de acá tienen que incluir el "cuándo", que es lo que distingue a este tema.
    palabras: ['proximo', 'siguiente', 'cuando', 'cuándo', 'cuando es mi turno', 'cuando tengo turno', 'que dia', 'qué día', 'horario', 'tengo turno'],
    responder: ({ turnos }) => {
      const t = proximoTurno(turnos);
      if (!t) {
        return {
          texto: 'No tenés ningún turno próximo agendado. Podés sacar uno en menos de un minuto.',
          acciones: [{ label: 'Solicitar turno', to: '/patient/solicitar' }],
        };
      }
      return {
        texto: `Tu próximo turno es ${describirTurno(t)}. Está ${ETIQUETAS[t.status]}.`,
        acciones: [{ label: 'Ver mis turnos', to: '/patient/turnos' }],
      };
    },
  },
  {
    id: 'ver-turnos',
    titulo: '¿Dónde veo todos mis turnos?',
    categoria: 'turnos',
    palabras: ['ver', 'mis turnos', 'listado', 'lista', 'historial', 'calendario', 'agenda', 'anteriores'],
    responder: ({ turnos }) => ({
      texto: turnos.length
        // La segunda frase no menciona la cantidad a propósito: así no hay que hacer concordar
        // el resto de la oración con el singular cuando hay un solo turno.
        ? `En la pestaña "Turnos" tenés ${plural(turnos.length, 'turno registrado', 'turnos registrados')}. Ahí se separan los próximos del historial, y desplegando "Calendario del mes" ves los días marcados con el color de cada estado.`
        : 'En la pestaña "Turnos" vas a ver tus próximos turnos y el historial. Todavía no tenés ninguno.',
      acciones: [{ label: 'Mis turnos', to: '/patient/turnos' }],
    }),
  },
  {
    id: 'cancelar-turno',
    titulo: '¿Cómo cancelo un turno?',
    categoria: 'turnos',
    palabras: ['cancelar', 'anular', 'dar de baja', 'no puedo ir', 'suspender', 'borrar turno'],
    responder: () => ({
      texto: 'En "Turnos" buscá el turno pendiente y tocá "Cancelar turno". Podés dejar el motivo si querés. Avisá con tiempo así el horario le queda libre a otra persona.',
      acciones: [{ label: 'Mis turnos', to: '/patient/turnos' }],
    }),
  },
  {
    id: 'reprogramar-turno',
    titulo: '¿Puedo cambiar la fecha de un turno?',
    categoria: 'turnos',
    palabras: ['cambiar', 'reprogramar', 'mover', 'otra fecha', 'otro dia', 'otro día', 'modificar turno'],
    responder: () => ({
      texto: 'No se puede editar un turno ya sacado. Lo que hacés es cancelarlo desde "Turnos" y sacar uno nuevo en el horario que te sirva. Si el turno ya está cancelado, el botón "Reagendar" te lleva directo al mismo médico.',
      acciones: [
        { label: 'Mis turnos', to: '/patient/turnos' },
        { label: 'Solicitar turno', to: '/patient/solicitar' },
      ],
    }),
  },
  {
    id: 'sobreturno',
    titulo: '¿Qué es un sobreturno?',
    categoria: 'turnos',
    palabras: ['sobreturno', 'lista de espera', 'espera', 'urgente', 'no hay lugar', 'sin lugar', 'completo'],
    responder: () => ({
      texto: 'Si el médico que buscás no tiene horarios libres, podés anotarte como sobreturno: quedás en lista de espera y, si se libera un lugar o el médico te lo asigna, te llega un aviso y el turno pasa a ser tuyo.',
      acciones: [{ label: 'Solicitar turno', to: '/patient/solicitar' }],
    }),
  },

  // ── Recetas ──
  {
    id: 'ver-recetas',
    titulo: '¿Dónde veo mis recetas?',
    categoria: 'recetas',
    palabras: ['receta', 'recetas', 'medicamento', 'remedio', 'medicacion', 'medicación', 'ver recetas'],
    responder: ({ recetas }) => {
      const vigentes = recetas.filter(r => estadoReceta(r.validoHasta) !== 'vencida');
      if (!recetas.length) {
        return {
          texto: 'Todavía no tenés recetas. Cuando un médico te emita una, la vas a ver en la pestaña "Recetas" con su fecha de vencimiento.',
          acciones: [{ label: 'Mis recetas', to: '/patient/recetas' }],
        };
      }
      return {
        texto: `Tenés ${plural(vigentes.length, 'receta vigente', 'recetas vigentes')} de ${plural(recetas.length, 'receta en total', 'recetas en total')}. En la pestaña "Recetas" está cada una con el medicamento, la dosis, la indicación y hasta cuándo vale.`,
        acciones: [{ label: 'Mis recetas', to: '/patient/recetas' }],
      };
    },
  },
  {
    id: 'vencimiento-recetas',
    titulo: '¿Cuándo se vencen mis recetas?',
    categoria: 'recetas',
    palabras: ['vence', 'vencen', 'vencimiento', 'vencida', 'vencidas', 'valida', 'válida', 'validez', 'caduca', 'expira', 'hasta cuando', 'hasta cuándo'],
    responder: ({ recetas }) => {
      if (!recetas.length) {
        return {
          texto: `Todavía no tenés recetas. Toda receta que te emitan lleva una fecha de vencimiento, y te vamos a avisar cuando falten ${DIAS_POR_VENCER} días o menos.`,
          acciones: [{ label: 'Mis recetas', to: '/patient/recetas' }],
        };
      }

      const porVencer = recetas.filter(r => estadoReceta(r.validoHasta) === 'por-vencer');
      const vencidas = recetas.filter(r => estadoReceta(r.validoHasta) === 'vencida');

      if (porVencer.length) {
        // La más urgente primero: es la que hay que renovar ya.
        const urgente = [...porVencer].sort((a, b) => a.validoHasta.localeCompare(b.validoHasta))[0];
        const dias = diasHastaVencer(urgente.validoHasta);
        const cuando = dias <= 0 ? 'vence hoy' : dias === 1 ? 'vence mañana' : `vence en ${dias} días`;
        return {
          texto: `Tenés ${plural(porVencer.length, 'receta por vencer', 'recetas por vencer')}. La más próxima es ${urgente.medicamento} y ${cuando} (el ${formatFecha(urgente.validoHasta)}). Pedile la renovación a tu médico en la próxima consulta.`,
          acciones: [{ label: 'Ver las que vencen', to: '/patient/recetas' }],
        };
      }

      if (vencidas.length && vencidas.length === recetas.length) {
        return {
          texto: `Todas tus recetas (${vencidas.length}) están vencidas. Una receta vencida no sirve en la farmacia: sacá un turno y pedile a tu médico que te la vuelva a emitir.`,
          acciones: [
            { label: 'Solicitar turno', to: '/patient/solicitar' },
            { label: 'Mis recetas', to: '/patient/recetas' },
          ],
        };
      }

      return {
        texto: `Ninguna de tus recetas vence en los próximos ${DIAS_POR_VENCER} días. En "Recetas" cada una muestra hasta cuándo es válida.`,
        acciones: [{ label: 'Mis recetas', to: '/patient/recetas' }],
      };
    },
  },
  {
    id: 'receta-farmacia',
    titulo: '¿Cómo le muestro una receta a la farmacia?',
    categoria: 'recetas',
    palabras: ['imprimir', 'impresion', 'impresión', 'descargar', 'pdf', 'papel', 'farmacia', 'mostrar receta', 'guardar receta'],
    responder: () => ({
      // La web tiene vista imprimible; la app no. Decirle que toque un ícono de impresora que
      // no existe lo deja dando vueltas por la pantalla.
      texto: 'Desde el celular podés mostrar la receta directamente de la pantalla "Recetas": ahí están el medicamento, la dosis, la indicación y la fecha de vencimiento. Si necesitás la versión impresa, entrá al sitio web con la misma cuenta y usá la opción de imprimir.',
      acciones: [{ label: 'Mis recetas', to: '/patient/recetas' }],
    }),
  },

  // ── Estudios ──
  {
    id: 'subir-estudio',
    titulo: '¿Cómo subo un estudio?',
    categoria: 'estudios',
    palabras: ['subir', 'cargar', 'adjuntar', 'estudio', 'estudios', 'analisis', 'análisis', 'radiografia', 'radiografía', 'informe', 'resultado'],
    responder: () => ({
      texto: 'Entrá a "Estudios" desde el Menú y tocá el botón de subir. Se abre el explorador del teléfono para que elijas el PDF o la foto, y le ponés un título para encontrarlo después.',
      acciones: [{ label: 'Mis estudios', to: '/patient/estudios' }],
    }),
  },
  {
    id: 'formatos-estudio',
    titulo: '¿Qué archivos puedo subir?',
    categoria: 'estudios',
    palabras: ['formato', 'formatos', 'archivo', 'tipo de archivo', 'peso', 'pesar', 'cuanto pesa', 'tamaño', 'tamano', 'mb', 'jpg', 'png', 'pdf', 'limite', 'límite'],
    responder: () => ({
      texto: 'Se aceptan PDF, JPG y PNG, de hasta 10 MB por archivo. Si tu estudio son varias hojas, lo mejor es juntarlas en un solo PDF antes de subirlo.',
      acciones: [{ label: 'Mis estudios', to: '/patient/estudios' }],
    }),
  },
  {
    id: 'ver-estudios',
    titulo: '¿Dónde veo mis estudios?',
    categoria: 'estudios',
    palabras: ['ver estudios', 'mis estudios', 'archivos', 'guardados', 'abrir estudio'],
    responder: ({ estudios }) => ({
      texto: estudios.length
        ? `Tenés ${plural(estudios.length, 'estudio guardado', 'estudios guardados')}. Desde "Estudios" los abrís tocando "Ver": el archivo se abre con el visor del teléfono.`
        : 'Todavía no subiste estudios. Cuando subas alguno vas a poder abrirlo desde "Estudios".',
      acciones: [{ label: 'Mis estudios', to: '/patient/estudios' }],
    }),
  },

  // ── Cuenta ──
  {
    id: 'foto-perfil',
    titulo: '¿Cómo cambio mi foto de perfil?',
    categoria: 'cuenta',
    palabras: ['foto', 'imagen', 'avatar', 'perfil foto', 'cambiar foto', 'sacar foto', 'galeria', 'galería', 'camara', 'cámara'],
    responder: () => ({
      texto: 'Entrá a "Perfil" y tocá la foto: podés elegir una de la galería, sacarte una con la cámara o quitar la que tenés y volver a tus iniciales.',
      acciones: [{ label: 'Mi perfil', to: '/patient/perfil' }],
    }),
  },
  {
    id: 'cambiar-password',
    titulo: '¿Cómo cambio mi contraseña?',
    categoria: 'cuenta',
    palabras: ['contrasena', 'contraseña', 'password', 'clave', 'cambiar clave', 'olvide', 'olvidé', 'seguridad'],
    responder: () => ({
      texto: 'Andá a "Perfil" y tocá "Contraseña": te pide la actual y la nueva. Si no te acordás de la actual, cerrá sesión y usá "¿Olvidaste tu contraseña?" en la pantalla de ingreso.',
      acciones: [{ label: 'Mi perfil', to: '/patient/perfil' }],
    }),
  },
  {
    id: 'editar-datos',
    titulo: '¿Cómo cambio mis datos personales?',
    categoria: 'cuenta',
    palabras: ['datos', 'perfil', 'telefono', 'teléfono', 'nombre', 'apellido', 'email', 'correo', 'actualizar', 'modificar datos', 'dni'],
    responder: () => ({
      texto: 'En "Perfil" tocá "Editar datos" para cambiar tu nombre, apellido y teléfono. El email y el DNI no se pueden modificar por tu cuenta: escribile a la administración del centro si hay un error.',
      acciones: [{ label: 'Mi perfil', to: '/patient/perfil' }],
    }),
  },
  {
    id: 'verificar-email',
    titulo: '¿Para qué verifico mi email o activo 2FA?',
    categoria: 'cuenta',
    palabras: ['verificar', 'verificacion', 'verificación', 'confirmar email', '2fa', 'dos pasos', 'doble factor', 'codigo', 'código', 'autenticacion'],
    responder: () => ({
      texto: 'Verificar tu email confirma que la casilla es tuya y nos deja mandarte los avisos de turnos y recetas. En "Perfil", en la sección de seguridad, también podés activar la verificación en dos pasos: además de la contraseña te va a pedir un código cada vez que entres.',
      acciones: [{ label: 'Mi perfil', to: '/patient/perfil' }],
    }),
  },
  {
    id: 'modo-oscuro',
    titulo: '¿Cómo pongo la app en modo oscuro?',
    categoria: 'cuenta',
    palabras: ['oscuro', 'modo oscuro', 'claro', 'modo claro', 'tema', 'apariencia', 'noche', 'brillo'],
    responder: () => ({
      texto: 'En la pestaña "Menú", abajo de todo, está "Apariencia": elegís Claro, Oscuro o Sistema (que sigue la configuración del teléfono). También tenés el botón redondo en la pantalla de Inicio.',
    }),
  },

  // ── Centros ──
  {
    id: 'centros',
    titulo: '¿Dónde quedan los centros de atención?',
    categoria: 'centros',
    palabras: ['donde', 'dónde', 'direccion', 'dirección', 'centro', 'centros', 'sede', 'mapa', 'como llego', 'cómo llego', 'ubicacion', 'ubicación', 'sucursal'],
    responder: () => ({
      texto: 'En "Centros y mapa" están todas las sedes ubicadas en el mapa, con su dirección y sus horarios de atención. Tocando una te muestra cómo llegar.',
      acciones: [{ label: 'Centros y mapa', to: '/patient/mapa' }],
    }),
  },
];

// ── El buscador ──

/**
 * Umbral mínimo de puntaje para dar una respuesta. Con menos que esto la coincidencia es una
 * casualidad (una preposición compartida, por ejemplo) y es mejor admitir que no se entendió
 * que contestar cualquier cosa.
 */
const UMBRAL = 2;

/** Palabras tan comunes que aparecer en la consulta no dice nada sobre el tema. */
const VACIAS = new Set([
  'que', 'qué', 'como', 'cómo', 'cual', 'cuál', 'para', 'por', 'con', 'sin', 'los', 'las',
  'del', 'una', 'uno', 'unos', 'unas', 'mis', 'mi', 'me', 'te', 'se', 'lo', 'la', 'el',
  'de', 'en', 'un', 'es', 'si', 'no', 'yo', 'hacer', 'puedo', 'quiero', 'necesito', 'hola',
  'y', 'o', 'a', 'ya', 'al',
]);

function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !VACIAS.has(t));
}

/**
 * Largo mínimo del prefijo compartido para considerar que dos palabras son la misma.
 *
 * Con 4 caracteres alcanza para las conjugaciones y los plurales que aparecen de verdad
 * ("imprimo"/"imprimir" comparten "imprim", "borro"/"borrar" comparten "borr") sin juntar
 * palabras distintas: "ver" tiene 3 letras, así que nunca se confunde con "verificar".
 */
const PREFIJO_MINIMO = 4;

function comparteRaiz(a: string, b: string): boolean {
  const tope = Math.min(a.length, b.length);
  if (tope < PREFIJO_MINIMO) return false;
  let i = 0;
  while (i < tope && a[i] === b[i]) i++;
  return i >= PREFIJO_MINIMO;
}

/**
 * Puntaje de un tema para una consulta. Las palabras clave pesan más que el título porque son
 * las que se eligieron a propósito para ese tema.
 *
 * Se compara de tres formas, de la señal más fuerte a la más débil, porque cada una atrapa un
 * caso distinto: las claves de varias palabras ("no puedo ir") solo pueden matchear contra la
 * consulta completa, y las conjugaciones ("imprimo" contra la clave "imprimir") solo matchean
 * por raíz compartida.
 */
function puntuar(tema: Tema, consulta: string, tokens: string[]): number {
  const claves = tema.palabras.map(normalizar);
  const titulo = normalizar(tema.titulo);

  let puntos = 0;

  // 1. Frases: una clave de varias palabras que aparece tal cual en la consulta pesa como una
  //    coincidencia exacta. No más que eso: una frase demasiado general le ganaría al verbo,
  //    que es lo que de verdad distingue un tema de otro dentro de la misma categoría.
  for (const clave of claves) {
    if (clave.includes(' ') && consulta.includes(clave)) puntos += 3;
  }

  // 2. Palabras sueltas.
  for (const token of tokens) {
    if (claves.includes(token)) { puntos += 3; continue; }
    if (claves.some(c => !c.includes(' ') && comparteRaiz(c, token))) { puntos += 2; continue; }
    // Contra las claves de varias palabras se compara por contención: "estudio" contra
    // "mis estudios" cuenta, aunque menos que una clave suelta.
    if (claves.some(c => c.includes(' ') && c.includes(token))) { puntos += 2; continue; }
    if (titulo.includes(token)) puntos += 1;
  }

  return puntos;
}

export interface Resultado {
  tema: Tema | null;
  /** Temas parecidos, para ofrecerlos cuando no se entendió la consulta. */
  sugerencias: Tema[];
}

/** Elige el tema que mejor responde a la consulta, o null si ninguno llega al umbral. */
export function buscarTema(consulta: string): Resultado {
  const tokens = tokenizar(consulta);
  if (!tokens.length) return { tema: null, sugerencias: TEMAS.slice(0, 3) };

  // La consulta normalizada completa, para poder buscar las claves de varias palabras.
  const texto = normalizar(consulta);

  const puntuados = TEMAS
    .map(tema => ({ tema, puntos: puntuar(tema, texto, tokens) }))
    .filter(p => p.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);

  const mejor = puntuados[0];
  if (!mejor || mejor.puntos < UMBRAL) {
    // Aunque no alcance el umbral, lo poco que matcheó sirve para sugerir.
    return { tema: null, sugerencias: puntuados.slice(0, 3).map(p => p.tema) };
  }

  return { tema: mejor.tema, sugerencias: puntuados.slice(1, 4).map(p => p.tema) };
}

/** Lo que responde el asistente cuando no encontró ningún tema. */
export function respuestaSinResultado(sugerencias: Tema[]): Respuesta {
  return {
    texto: sugerencias.length
      ? 'No estoy seguro de haber entendido. ¿Alguna de estas es lo que buscabas?'
      : 'No tengo una respuesta para eso. Puedo ayudarte con turnos, recetas, estudios, tu cuenta y los centros de atención. Si es una consulta médica, hablalo con tu profesional en la próxima consulta.',
  };
}

/** Los temas que se ofrecen de arranque, uno por categoría, sin repetir. */
export const TEMAS_DESTACADOS: Tema[] = [
  TEMAS.find(t => t.id === 'proximo-turno')!,
  TEMAS.find(t => t.id === 'sacar-turno')!,
  TEMAS.find(t => t.id === 'cancelar-turno')!,
  TEMAS.find(t => t.id === 'vencimiento-recetas')!,
  TEMAS.find(t => t.id === 'subir-estudio')!,
];

/** Saludo inicial. Usa el nombre si lo tenemos, para que no arranque en frío. */
export function saludoInicial(nombre?: string): string {
  return nombre
    ? `¡Hola, ${nombre}! ¿En qué te puedo ayudar?`
    : '¡Hola! ¿En qué te puedo ayudar?';
}
