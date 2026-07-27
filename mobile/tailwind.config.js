/** @type {import('tailwindcss').Config} */
// Sistema de diseño "EMS Green" (espeja web/tailwind.config.js).
// Marca verde salud, rail verde bosque, lienzo claro tintado, semánticos por estado.
//
// Los colores salen de las variables de global.css como canales sueltos, igual que en la web:
// así `bg-brand-500/15` puede componer opacidad y el modo oscuro se resuelve en la capa de
// tokens en vez de repetir variantes `dark:` en cada pantalla.
//
// `darkMode: 'class'` es lo que habilita dos cosas: que NativeWind lea el bloque `.dark:root`
// de global.css, y que se pueda forzar el tema a mano con colorScheme.set() (con el modo
// 'media' por defecto solo seguiría al sistema). Ver store/useThemeStore.ts.
const canal = (nombre) => `rgb(var(--${nombre}) / <alpha-value>)`;

// Genera { 50: 'rgb(var(--x-50) / <alpha-value>)', ... } para las rampas.
const rampa = (nombre, pasos) =>
  Object.fromEntries(pasos.map((p) => [p, canal(`${nombre}-${p}`)]));

const PASOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas:  canal('canvas'),
        surface: canal('surface'),
        scrim:   canal('scrim'),
        rail: {
          DEFAULT: canal('rail'),
          soft:    canal('rail-soft'),
          fg:      canal('rail-fg'),
          mint:    canal('rail-mint'),
        },
        brand: rampa('brand', PASOS),
        // slate y amber se redefinen a propósito: las rampas por defecto de Tailwind son hex
        // fijos y no se invertirían en oscuro, así que `text-slate-900` quedaría negro sobre
        // fondo negro.
        slate: rampa('slate', PASOS),
        amber: rampa('amber', PASOS),
        success: { DEFAULT: canal('success'), soft: canal('success-soft'), text: canal('success-text') },
        warning: { DEFAULT: canal('warning'), soft: canal('warning-soft'), text: canal('warning-text') },
        danger:  { DEFAULT: canal('danger'),  soft: canal('danger-soft'),  text: canal('danger-text') },
        info:    { DEFAULT: canal('info'),    soft: canal('info-soft'),    text: canal('info-text') },
      },
      borderRadius: {
        field: '10px',
        card:  '20px',
        rail:  '24px',
        pill:  '999px',
      },
      letterSpacing: {
        tightish: '-0.011em',
        tighter2: '-0.02em',
      },
    },
  },
  plugins: [],
};
