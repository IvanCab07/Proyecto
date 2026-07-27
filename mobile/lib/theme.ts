// Valores crudos del sistema "EMS Green" para lo que className no alcanza en React Native:
// colores de íconos, StatusBar, react-native-maps, RefreshControl, sombras (RN no traduce las
// de la web 1:1) y gradientes (expo-linear-gradient).
//
// IMPORTANTE: las dos paletas de acá son el espejo en hex de las variables de global.css. Si
// tocás un token allá, tocalo acá. No hay forma de leer el CSS en runtime: NativeWind lo
// compila para los className, pero estos valores los consume JS directo.
//
// No importes `lightColors` / `darkColors` desde una pantalla: usá el hook useTheme(), que
// elige la paleta según el tema activo. Ver lib/useTheme.ts.

/** Una rampa de color de Tailwind, 50→950. */
export type Ramp = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>;

/** Un color semántico con su fondo tenue y su color de texto. */
export interface Semantic { DEFAULT: string; soft: string; text: string }

export interface Palette {
  canvas: string;
  surface: string;
  scrim: string;
  rail: string;
  railSoft: string;
  railFg: string;
  railMint: string;
  brand: Ramp;
  amber: Ramp;
  slate: Ramp;
  success: Semantic;
  warning: Semantic;
  danger: Semantic;
  info: Semantic;
  white: string;
}

export const lightColors: Palette = {
  canvas:  '#F8FAF9',
  surface: '#FFFFFF',
  scrim:   '#020617',

  // El rail verde bosque y la menta son iguales en los dos temas: son la marca, no una
  // superficie. Lo que va encima usa railFg.
  rail:     '#2C5F4E',
  railSoft: '#3A6B5A',
  railFg:   '#FFFFFF',
  railMint: '#7BDC93',

  brand: {
    50:  '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#7BDC93', 400: '#4ADE80',
    500: '#22C55E', 600: '#16A34A', 700: '#15803D', 800: '#166534', 900: '#14532D', 950: '#052E16',
  },
  amber: {
    50:  '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24',
    500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F', 950: '#451A03',
  },
  slate: {
    50:  '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8',
    500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A', 950: '#020617',
  },
  success: { DEFAULT: '#16A34A', soft: '#DCFCE7', text: '#15803D' },
  warning: { DEFAULT: '#D97706', soft: '#FEF3C7', text: '#B45309' },
  danger:  { DEFAULT: '#DC2626', soft: '#FEE2E2', text: '#B91C1C' },
  info:    { DEFAULT: '#0EA5E9', soft: '#E0F2FE', text: '#0369A1' },

  white: '#FFFFFF',
};

export const darkColors: Palette = {
  canvas:  '#0F172A',
  surface: '#1E293B',
  scrim:   '#020617',

  rail:     '#2C5F4E',
  railSoft: '#3A6B5A',
  railFg:   '#FFFFFF',
  railMint: '#7BDC93',

  // Extremos invertidos: los tintes se oscurecen y los oscuros aclaran. 300-700 no se tocan,
  // así un botón brand-600 con texto blanco sigue siendo el mismo en los dos temas.
  brand: {
    50:  '#0E2A1B', 100: '#14532D', 200: '#166534', 300: '#7BDC93', 400: '#4ADE80',
    500: '#22C55E', 600: '#16A34A', 700: '#15803D', 800: '#86EFAC', 900: '#BBF7D0', 950: '#DCFCE7',
  },
  amber: {
    50:  '#3A2B10', 100: '#4A3612', 200: '#78350F', 300: '#FCD34D', 400: '#FBBF24',
    500: '#F59E0B', 600: '#FBBF24', 700: '#FCD34D', 800: '#FDE68A', 900: '#FEF3C7', 950: '#FFFBEB',
  },
  slate: {
    50:  '#1E293B', 100: '#273548', 200: '#334155', 300: '#475569', 400: '#7C8EA8',
    500: '#94A3B8', 600: '#B4C0CE', 700: '#CBD5E1', 800: '#E2E8F0', 900: '#F1F5F9', 950: '#F8FAFC',
  },
  success: { DEFAULT: '#22C55E', soft: '#14321F', text: '#4ADE80' },
  warning: { DEFAULT: '#F59E0B', soft: '#3A2B10', text: '#FBBF24' },
  danger:  { DEFAULT: '#EF4444', soft: '#3A1A1A', text: '#F87171' },
  info:    { DEFAULT: '#38BDF8', soft: '#10293A', text: '#7DD3FC' },

  white: '#FFFFFF',
};

export const paletteFor = (isDark: boolean): Palette => (isDark ? darkColors : lightColors);

/**
 * Colores de marca que NO dependen del tema: son los mismos en claro y en oscuro.
 *
 * El rail verde y la menta son identidad, no superficie —igual que en la web, donde `--rail` y
 * `--rail-mint` son los únicos tokens que el bloque `.dark` no toca—. Lo que va encima de ellos
 * usa `railFg`, nunca la rampa slate (que sí se invierte y quedaría gris oscuro sobre verde).
 *
 * Importalos directo, sin hook: no hay nada que elegir según el tema.
 */
export const marca = {
  rail:     lightColors.rail,
  railSoft: lightColors.railSoft,
  railFg:   lightColors.railFg,
  mint:     lightColors.railMint,
  /** El verde de marca vivo, para halos y acentos sobre el rail. */
  verde:    lightColors.brand[500],
} as const;

export type TurnoStatus = 'PENDIENTE' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'EN_ESPERA' | 'AUSENTE';

export interface StatusStyle {
  label: string; pillBg: string; pillText: string; dot: string; strip: string; soft: string;
}

// Fuente única de verdad de los colores por estado (alineado con la web):
// PENDIENTE→warning, CONFIRMADO→brand, COMPLETADO→success, CANCELADO→danger,
// EN_ESPERA (sobreturno)→info, AUSENTE (no-show)→slate.
export const statusFor = (c: Palette): Record<TurnoStatus, StatusStyle> => ({
  PENDIENTE:  { label: 'Pendiente',  pillBg: c.warning.soft, pillText: c.warning.text, dot: c.warning.DEFAULT, strip: c.warning.DEFAULT, soft: c.warning.soft },
  CONFIRMADO: { label: 'Confirmado', pillBg: c.brand[100],   pillText: c.brand[800],   dot: c.brand[600],      strip: c.brand[600],      soft: c.brand[50] },
  COMPLETADO: { label: 'Completado', pillBg: c.success.soft, pillText: c.success.text, dot: c.success.DEFAULT, strip: c.success.DEFAULT, soft: c.success.soft },
  CANCELADO:  { label: 'Cancelado',  pillBg: c.danger.soft,  pillText: c.danger.text,  dot: c.danger.DEFAULT,  strip: c.danger.DEFAULT,  soft: c.danger.soft },
  EN_ESPERA:  { label: 'En espera',  pillBg: c.info.soft,    pillText: c.info.text,    dot: c.info.DEFAULT,    strip: c.info.DEFAULT,    soft: c.info.soft },
  AUSENTE:    { label: 'Ausente',    pillBg: c.slate[100],   pillText: c.slate[500],   dot: c.slate[400],      strip: c.slate[400],      soft: c.slate[100] },
});

export interface ShadowSet {
  xs: object; card: object; pop: object; modal: object; glowBrand: object;
}

// Sombras como estilo RN (shadow* en iOS, elevation en Android).
//
// En oscuro se van a negro puro y con más opacidad: sobre un lienzo #0F172A una sombra
// tenue gris no se ve, y las tarjetas quedarían planas contra el fondo.
export const shadowFor = (isDark: boolean): ShadowSet => {
  const tinte = isDark ? '#000000' : '#0F172A';
  const k = isDark ? 1.8 : 1;
  return {
    xs:    { shadowColor: tinte, shadowOpacity: 0.06 * k, shadowRadius: 2,  shadowOffset: { width: 0, height: 1 },  elevation: 1 },
    card:  { shadowColor: tinte, shadowOpacity: 0.10 * k, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },  elevation: 3 },
    pop:   { shadowColor: tinte, shadowOpacity: 0.14 * k, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
    modal: { shadowColor: tinte, shadowOpacity: 0.22 * k, shadowRadius: 40, shadowOffset: { width: 0, height: 16 }, elevation: 16 },
    glowBrand: { shadowColor: lightColors.brand[500], shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  };
};

// Gradientes para <LinearGradient colors={...}>.
//
// No dependen del tema, igual que en la web: el rail verde y el degradado de marca son la
// identidad y se ven bien sobre cualquier lienzo. Por eso se importan directo, sin hook.
export const gradients = {
  /** Botones y acentos sólidos: brand-400 → 500 → 600. */
  brand:    ['#4ADE80', '#22C55E', '#16A34A'] as const,
  /** Barra/rail: el `gradient-sidebar` de la web (160deg). */
  rail:     ['#2C5F4E', '#2C5F4E', '#3A6B5A'] as const,
  /** Heros de pantalla y `gradient-card` de la web (135deg, vuelve al rail al final). */
  railCard: ['#2C5F4E', '#3A6B5A', '#2C5F4E'] as const,
  /** Alias de railCard: es el gradiente que usan los heros de cada pantalla de inicio. */
  railHero: ['#2C5F4E', '#3A6B5A', '#2C5F4E'] as const,
  /** Menta: el `gradient-primary` de la web, para el badge del logo. */
  mint:     ['#7BDC93', '#4ADE80'] as const,
};
