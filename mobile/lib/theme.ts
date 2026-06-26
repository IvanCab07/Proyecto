// Valores crudos del sistema "Teal Clinical Dashboard" para lo que className no alcanza
// en React Native: colores de íconos, StatusBar, react-native-maps, RefreshControl,
// sombras (RN no traduce las de la web 1:1) y gradientes (expo-linear-gradient).

export const colors = {
  canvas:  '#EEF3F3',
  surface: '#FFFFFF',
  rail:    '#0B1B1A',
  railSoft:'#13302C',

  brand: {
    50:  '#ECFEFB', 100: '#CFFAF1', 200: '#9EF2E3', 300: '#5FE3D0', 400: '#2BC9B8',
    500: '#14B8A6', 600: '#0D9488', 700: '#0F766E', 800: '#115E59', 900: '#134E4A', 950: '#042F2E',
  },
  slate: {
    50:  '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8',
    500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A',
  },
  success: { DEFAULT: '#16A34A', soft: '#DCFCE7', text: '#15803D' },
  warning: { DEFAULT: '#D97706', soft: '#FEF3C7', text: '#B45309' },
  danger:  { DEFAULT: '#DC2626', soft: '#FEE2E2', text: '#B91C1C' },
  info:    { DEFAULT: '#0EA5E9', soft: '#E0F2FE', text: '#0369A1' },

  white: '#FFFFFF',
} as const;

export type TurnoStatus = 'PENDIENTE' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'EN_ESPERA' | 'AUSENTE';

// Fuente única de verdad de los colores por estado (alineado con la web):
// PENDIENTE→warning, CONFIRMADO→brand, COMPLETADO→success, CANCELADO→danger,
// EN_ESPERA (sobreturno)→info, AUSENTE (no-show)→slate.
export const STATUS: Record<TurnoStatus, {
  label: string; pillBg: string; pillText: string; dot: string; strip: string; soft: string;
}> = {
  PENDIENTE:  { label: 'Pendiente',  pillBg: colors.warning.soft, pillText: colors.warning.text, dot: colors.warning.DEFAULT, strip: colors.warning.DEFAULT, soft: colors.warning.soft },
  CONFIRMADO: { label: 'Confirmado', pillBg: colors.brand[100],   pillText: colors.brand[800],   dot: colors.brand[600],     strip: colors.brand[600],     soft: colors.brand[50] },
  COMPLETADO: { label: 'Completado', pillBg: colors.success.soft, pillText: colors.success.text, dot: colors.success.DEFAULT, strip: colors.success.DEFAULT, soft: colors.success.soft },
  CANCELADO:  { label: 'Cancelado',  pillBg: colors.danger.soft,  pillText: colors.danger.text,  dot: colors.danger.DEFAULT,  strip: colors.danger.DEFAULT,  soft: colors.danger.soft },
  EN_ESPERA:  { label: 'En espera',  pillBg: colors.info.soft,    pillText: colors.info.text,    dot: colors.info.DEFAULT,    strip: colors.info.DEFAULT,    soft: colors.info.soft },
  AUSENTE:    { label: 'Ausente',    pillBg: colors.slate[100],   pillText: colors.slate[500],   dot: colors.slate[400],      strip: colors.slate[400],      soft: colors.slate[100] },
};

// Sombras como estilo RN (shadow* en iOS, elevation en Android).
export const shadow = {
  xs:    { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 2,  shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  card:  { shadowColor: '#0F172A', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  pop:   { shadowColor: '#0F172A', shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  modal: { shadowColor: '#0F172A', shadowOpacity: 0.22, shadowRadius: 40, shadowOffset: { width: 0, height: 16 }, elevation: 16 },
  glowBrand: { shadowColor: '#0D9488', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
} as const;

// Gradientes para <LinearGradient colors={...}>.
export const gradients = {
  brand:    ['#0D9488', '#0F766E', '#115E59'] as const,
  rail:     ['#0C1F1D', '#0B1B1A'] as const,
  railHero: ['#0C2422', '#0B1B1A', '#0A1615'] as const,
};
