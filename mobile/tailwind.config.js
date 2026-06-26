/** @type {import('tailwindcss').Config} */
// Sistema de diseño "Teal Clinical Dashboard" (espeja la web).
// Marca teal/esmeralda salud, lienzo tintado claro, rail oscuro, semánticos por estado.
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas:  '#EEF3F3',
        surface: '#FFFFFF',
        rail: {
          DEFAULT: '#0B1B1A',
          soft:    '#13302C',
        },
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
        success: { DEFAULT: '#16A34A', soft: '#DCFCE7', text: '#15803D' },
        warning: { DEFAULT: '#D97706', soft: '#FEF3C7', text: '#B45309' },
        danger:  { DEFAULT: '#DC2626', soft: '#FEE2E2', text: '#B91C1C' },
        info:    { DEFAULT: '#0EA5E9', soft: '#E0F2FE', text: '#0369A1' },
      },
      borderRadius: {
        field: '10px',
        card:  '16px',
        pill:  '999px',
      },
    },
  },
  plugins: [],
};
