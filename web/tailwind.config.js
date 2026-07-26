/** @type {import('tailwindcss').Config} */
// Sistema de diseño "EMS Green".
// Rail lateral flotante verde bosque + lienzo claro casi blanco. Marca verde
// (#22c55e) con acento menta (#7bdc93), neutros fríos, semánticos por estado
// de turno. Todos los colores salen de variables CSS (ver src/index.css), así
// el modo oscuro se resuelve en la capa de tokens y no en cada componente.
const v = name => `rgb(var(--${name}) / <alpha-value>)`;

const ramp = prefix =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(s => [s, v(`${prefix}-${s}`)]),
  );

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Lienzo tintado (NO blanco) vs superficies → da profundidad.
        canvas:  v('canvas'),
        surface: v('surface'),
        // Velo de modales y drawers: oscuro en ambos temas.
        scrim:   v('scrim'),
        // Rail lateral: verde bosque, idéntico en claro y oscuro.
        rail: {
          DEFAULT: v('rail'),
          soft:    v('rail-soft'),
          fg:      v('rail-fg'),
          mint:    v('rail-mint'),
        },
        // Marca: verde EMS (color protagonista).
        brand: ramp('brand'),
        // Neutros: la rampa se invierte en modo oscuro.
        slate: ramp('slate'),
        // Ámbar (sobreturnos, estrellas): también theme-aware.
        amber: ramp('amber'),
        // Semánticos por estado de turno (cada uno bien distinto del otro).
        success: { DEFAULT: v('success'), soft: v('success-soft'), text: v('success-text') }, // COMPLETADO
        warning: { DEFAULT: v('warning'), soft: v('warning-soft'), text: v('warning-text') }, // PENDIENTE
        danger:  { DEFAULT: v('danger'),  soft: v('danger-soft'),  text: v('danger-text')  }, // CANCELADO
        info:    { DEFAULT: v('info'),    soft: v('info-soft'),    text: v('info-text')    }, // avisos varios
      },
      borderRadius: {
        field: '10px',
        card:  '20px',
        rail:  '24px',
        pill:  '999px',
      },
      boxShadow: {
        xs:    '0 1px 2px rgb(2 6 23 / 0.06)',
        card:  '0 0 0 1px rgb(2 6 23 / 0.04), 0 1px 2px -1px rgb(2 6 23 / 0.06), 0 6px 16px -6px rgb(2 6 23 / 0.10)',
        lift:  '0 0 0 1px rgb(2 6 23 / 0.05), 0 4px 8px -2px rgb(2 6 23 / 0.08), 0 16px 32px -12px rgb(2 6 23 / 0.16)',
        pop:   '0 0 0 1px rgb(2 6 23 / 0.05), 0 6px 12px -3px rgb(2 6 23 / 0.10), 0 16px 32px -8px rgb(2 6 23 / 0.14)',
        modal: '0 0 0 1px rgb(2 6 23 / 0.05), 0 10px 20px -6px rgb(2 6 23 / 0.14), 0 30px 60px -12px rgb(2 6 23 / 0.22)',
        rail:  '0 8px 24px -8px rgb(2 6 23 / 0.28), 0 24px 48px -16px rgb(2 6 23 / 0.24)',
        focus: '0 0 0 3px rgb(var(--brand-500) / 0.30)',
        btn:   'inset 0 1px 0 rgb(255 255 255 / 0.16), 0 1px 2px rgb(2 6 23 / 0.20)',
        'glow-brand': '0 6px 18px -4px rgb(var(--brand-500) / 0.45)',
        'glow-mint':  '0 0 20px rgb(var(--rail-mint) / 0.30), 0 0 40px rgb(var(--rail-mint) / 0.10)',
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
        'brand-grad': 'linear-gradient(135deg, rgb(var(--brand-400)) 0%, rgb(var(--brand-500)) 55%, rgb(var(--brand-600)) 100%)',
        'rail-grad':  'linear-gradient(160deg, rgb(var(--rail)) 0%, rgb(var(--rail)) 45%, rgb(var(--rail-soft)) 100%)',
        'mint-grad':  'linear-gradient(135deg, rgb(var(--brand-300)) 0%, rgb(var(--brand-400)) 100%)',
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
