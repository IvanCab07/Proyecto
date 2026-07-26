// Genera public/favicon.svg y public/apple-touch-icon.png a partir del logo.
//
// Antes el favicon era una copia hecha a mano de las mismas paths y se desincronizaba en
// cuanto alguien tocaba el símbolo. Ahora hay una sola fuente de verdad: si cambiás el logo,
// corré `npm run favicon` y commiteá los archivos resultantes.
//
// La GEOMETRÍA sale de src/ui/Logo.tsx y los COLORES de src/index.css. Los dos se leen con
// regex en vez de importarlos: son TypeScript/CSS y node no los ejecuta sin un paso de build,
// que para cuatro strings no vale la pena. Antes los colores estaban hardcodeados acá y
// cambiar --rail en index.css desincronizaba el favicon en silencio: el mismo problema que
// este script ya resolvía para las paths.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Saca el valor de una constante string o número exportada por Logo.tsx. */
function constante(fuente, nombre) {
  const re = new RegExp(`export const ${nombre}[^=]*=\\s*(?:'([^']*)'|([\\d.]+))`, 's');
  const m = fuente.match(re);
  if (!m) throw new Error(`No encontré ${nombre} en src/ui/Logo.tsx`);
  return m[1] ?? m[2];
}

/**
 * Lee un token de color del :root de index.css y lo pasa a hex.
 * Los tokens están guardados como canales sueltos ("44 95 78") para que Tailwind pueda
 * componerles opacidad con rgb(var(--x) / <alpha-value>).
 */
function token(css, nombre) {
  const m = css.match(new RegExp(`--${nombre}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`));
  if (!m) throw new Error(`No encontré --${nombre} en src/index.css`);
  return '#' + m.slice(1, 4).map((c) => Number(c).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const css = await readFile(join(raiz, 'src/index.css'), 'utf8');

const FONDO_DESDE = token(css, 'rail-soft');
const FONDO_HASTA = token(css, 'rail');
const COLOR_CRUZ = token(css, 'rail-mint');
const COLOR_LATIDO = token(css, 'rail-fg');

const fuente = await readFile(join(raiz, 'src/ui/Logo.tsx'), 'utf8');

const cruz = constante(fuente, 'CRUZ_PATH');
const latido = constante(fuente, 'LATIDO_PATH');
const anchoCruz = constante(fuente, 'CRUZ_ANCHO');
const anchoLatido = constante(fuente, 'LATIDO_ANCHO');

// El símbolo está dibujado sobre un viewBox de 24; el favicon es de 48 con 4px de aire a
// cada lado, así que va escalado 40/24 = 1.6667 y desplazado 4.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <!-- Generado por scripts/gen-favicon.mjs a partir de src/ui/Logo.tsx. No editar a mano. -->
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${FONDO_DESDE}"/>
      <stop offset="1" stop-color="${FONDO_HASTA}"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#g)"/>
  <g transform="translate(4 4) scale(1.6667)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="${COLOR_CRUZ}" stroke-width="${anchoCruz}" d="${cruz}"/>
    <path stroke="${COLOR_LATIDO}" stroke-width="${anchoLatido}" d="${latido}"/>
  </g>
</svg>
`;

await writeFile(join(raiz, 'public/favicon.svg'), svg, 'utf8');
console.log('public/favicon.svg actualizado desde src/ui/Logo.tsx + src/index.css');

// iOS ignora el favicon SVG y usa este PNG cuando alguien agrega la app a la pantalla de
// inicio. 180x180 es el tamaño que pide Apple; también lo reusa el manifest para el ícono
// de instalación en Android.
const APPLE = 180;
await sharp(Buffer.from(svg)).resize(APPLE, APPLE).png().toFile(join(raiz, 'public/apple-touch-icon.png'));
console.log(`public/apple-touch-icon.png actualizado (${APPLE}x${APPLE})`);
