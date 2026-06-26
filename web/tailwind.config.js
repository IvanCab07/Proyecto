/** @type {import('tailwindcss').Config} */
// Sistema de diseño "Teal Clinical Dashboard".
// Barra lateral oscura + lienzo claro tintado. Marca teal/esmeralda salud,
// neutros fríos (slate de Tailwind), semánticos por estado de turno.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Lienzo tintado (NO blanco) vs superficies blancas → da profundidad.
        canvas:  '#EEF3F3',
        surface: '#FFFFFF',
        // Barra lateral oscura (teal-charcoal profundo).
        rail: {
          DEFAULT: '#0B1B1A',
          soft:    '#13302C',
        },
        // Marca: teal / esmeralda salud (color protagonista).
        brand: {
          50:  '#ECFEFB',
          100: '#CFFAF1',
          200: '#9EF2E3',
          300: '#5FE3D0',
          400: '#2BC9B8',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        // Semánticos por estado de turno (cada uno bien distinto del otro).
        success: { DEFAULT: '#16A34A', soft: '#DCFCE7', text: '#15803D' }, // COMPLETADO
        warning: { DEFAULT: '#D97706', soft: '#FEF3C7', text: '#B45309' }, // PENDIENTE
        danger:  { DEFAULT: '#DC2626', soft: '#FEE2E2', text: '#B91C1C' }, // CANCELADO
        info:    { DEFAULT: '#0EA5E9', soft: '#E0F2FE', text: '#0369A1' }, // avisos varios
      },
      borderRadius: {
        field: '10px',
        card:  '16px',
        pill:  '999px',
      },
      boxShadow: {
        xs:    '0 1px 2px rgb(15 23 42 / 0.06)',
        card:  '0 0 0 1px rgb(15 23 42 / 0.04), 0 1px 2px -1px rgb(15 23 42 / 0.06), 0 4px 12px -4px rgb(15 23 42 / 0.10)',
        pop:   '0 0 0 1px rgb(15 23 42 / 0.05), 0 6px 12px -3px rgb(15 23 42 / 0.10), 0 16px 32px -8px rgb(15 23 42 / 0.14)',
        modal: '0 0 0 1px rgb(15 23 42 / 0.05), 0 10px 20px -6px rgb(15 23 42 / 0.14), 0 30px 60px -12px rgb(15 23 42 / 0.22)',
        focus: '0 0 0 3px rgb(13 148 136 / 0.30)',
        'btn':  'inset 0 1px 0 rgb(255 255 255 / 0.14), 0 1px 2px rgb(15 23 42 / 0.20)',
        'glow-brand': '0 6px 18px -4px rgb(13 148 136 / 0.50)',
      },
      fontFamily: {
        sans:    ['"Inter Variable"', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightish: '-0.011em',
        tighter2: '-0.02em',
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg, #0D9488 0%, #0F766E 55%, #115E59 100%)',
        'rail-grad':  'linear-gradient(180deg, #0C1F1D 0%, #0B1B1A 100%)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
