import type { CSSProperties } from 'react';
import { useThemeStore } from '../store/useThemeStore';

// Recharts colorea por props, no por CSS, así que los tokens del tema no le
// llegan solos: acá se resuelven en JS a partir del tema activo.
// Sistema "EMS Green": rampa monocroma verde para series, colores bien
// separados entre sí para los estados de turno.

interface ChartTheme {
  ink: string;
  brand: string;
  brandSoft: string;
  grid: string;
  axis: string;
  series: string[];
  status: Record<string, string>;
  cursorFill: string;
  tooltipStyle: CSSProperties;
  axisTickStyle: { fill: string; fontSize: number };
}

const build = (dark: boolean): ChartTheme => {
  const ink       = dark ? '#F1F5F9' : '#0F172A';
  const axis      = dark ? '#7C8EA8' : '#94A3B8';
  const grid      = dark ? '#334155' : '#E2E8F0';
  const brand     = dark ? '#4ADE80' : '#16A34A';
  const brandSoft = dark ? '#14532D' : '#DCFCE7';

  return {
    ink, axis, grid, brand, brandSoft,
    series: dark
      ? ['#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D']
      : ['#22C55E', '#16A34A', '#15803D', '#166534', '#14532D'],
    // Por estado de turno: cada uno tiene que leerse distinto del otro.
    status: dark
      ? { PENDIENTE: '#FBBF24', CONFIRMADO: '#86EFAC', COMPLETADO: '#22C55E', CANCELADO: '#F87171' }
      : { PENDIENTE: '#D97706', CONFIRMADO: '#22C55E', COMPLETADO: '#15803D', CANCELADO: '#DC2626' },
    cursorFill: dark ? 'rgb(74 222 128 / 0.10)' : 'rgb(22 163 74 / 0.07)',
    tooltipStyle: {
      background: dark ? '#1E293B' : '#FFFFFF',
      border: 'none',
      borderRadius: 12,
      boxShadow: dark
        ? '0 0 0 1px rgb(255 255 255 / 0.08), 0 10px 24px -8px rgb(2 6 23 / 0.60)'
        : '0 0 0 1px rgb(2 6 23 / 0.05), 0 6px 12px -3px rgb(2 6 23 / 0.10), 0 16px 32px -8px rgb(2 6 23 / 0.14)',
      fontSize: 13,
      fontWeight: 500,
      color: ink,
      padding: '8px 12px',
    },
    axisTickStyle: { fill: axis, fontSize: 12 },
  };
};

const LIGHT = build(false);
const DARK = build(true);

export function useChartTheme(): ChartTheme {
  return useThemeStore(s => s.theme) === 'dark' ? DARK : LIGHT;
}

// Valores estáticos del tema claro: sirven fuera de React (por ejemplo, los
// pines de Leaflet, que se construyen a nivel de módulo).
export const CHART = LIGHT;
export const tooltipStyle = LIGHT.tooltipStyle;
export const axisTickStyle = LIGHT.axisTickStyle;
