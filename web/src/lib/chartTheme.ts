import type { CSSProperties } from 'react';

// Colores de recharts centralizados (recharts colorea por props, no por CSS).
// Sistema "Teal Clinical Dashboard".
export const CHART = {
  ink:       '#0F172A',
  brand:     '#0D9488',
  brandSoft: '#CFFAF1',
  grid:      '#E2E8F0',
  axis:      '#94A3B8',
  series: ['#0D9488', '#16A34A', '#D97706', '#0EA5E9', '#DC2626'],
  // Por estado de turno
  status: {
    PENDIENTE:  '#D97706',
    CONFIRMADO: '#0D9488',
    COMPLETADO: '#16A34A',
    CANCELADO:  '#DC2626',
  } as Record<string, string>,
} as const;

export const tooltipStyle: CSSProperties = {
  background: '#FFFFFF',
  border: 'none',
  borderRadius: 12,
  boxShadow: '0 0 0 1px rgb(15 23 42 / 0.05), 0 6px 12px -3px rgb(15 23 42 / 0.10), 0 16px 32px -8px rgb(15 23 42 / 0.14)',
  fontSize: 13,
  fontWeight: 500,
  color: '#0F172A',
  padding: '8px 12px',
};

export const axisTickStyle = { fill: CHART.axis, fontSize: 12 } as const;
