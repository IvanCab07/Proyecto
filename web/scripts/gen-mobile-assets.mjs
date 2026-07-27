// Genera los assets de la app mobile a partir de las fuentes de la web.
//
// Sale de acá y no de mobile/ porque las dos cosas que necesita viven en este proyecto: la
// geometría del logo (src/ui/Logo.tsx), los colores (src/index.css) y las láminas botánicas en
// alta (assets-fuente/). También es donde ya está instalado sharp.
//
// Escribe en ../mobile/assets/:
//   icon.png          1024  ícono de la app (cuadrado con el fondo verde rail)
//   adaptive-icon.png 1024  capa de frente para Android (glifo sobre transparente)
//   splash-icon.png    512  glifo sobre transparente para la pantalla de arranque
//   favicon.png         48  Expo web
//   auth-{login,register,recovery}.png  las láminas, reducidas para mobile
//
// Ojo: cambiar el ícono acá no alcanza para que cambie el del launcher de Android. La carpeta
// mobile/android/ está prebuildeada y commiteada, así que hay que correr después
// `npx expo prebuild --platform android --clean` para regenerar los mipmap-*/ic_launcher.
//
// Corré `npm run assets-mobile`.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, '..', 'mobile', 'assets');

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
const fuente = await readFile(join(raiz, 'src/ui/Logo.tsx'), 'utf8');

const FONDO_DESDE = token(css, 'rail-soft');
const FONDO_HASTA = token(css, 'rail');
const COLOR_CRUZ = token(css, 'rail-mint');
const COLOR_LATIDO = token(css, 'rail-fg');

const cruz = constante(fuente, 'CRUZ_PATH');
const latido = constante(fuente, 'LATIDO_PATH');
const anchoCruz = constante(fuente, 'CRUZ_ANCHO');
const anchoLatido = constante(fuente, 'LATIDO_ANCHO');

/**
 * El símbolo está dibujado sobre un viewBox de 24. `escala` es la fracción del lienzo que
 * ocupa el glifo, y `fondo` decide si va el cuadrado redondeado verde detrás.
 */
function svg({ lado, escala, fondo }) {
  const glifo = lado * escala;
  const k = glifo / 24;
  const off = (lado - glifo) / 2;
  const radio = Math.round(lado * 0.22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${FONDO_DESDE}"/>
      <stop offset="1" stop-color="${FONDO_HASTA}"/>
    </linearGradient>
  </defs>
  ${fondo ? `<rect width="${lado}" height="${lado}" rx="${radio}" fill="url(#g)"/>` : ''}
  <g transform="translate(${off} ${off}) scale(${k})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="${COLOR_CRUZ}" stroke-width="${anchoCruz}" d="${cruz}"/>
    <path stroke="${COLOR_LATIDO}" stroke-width="${anchoLatido}" d="${latido}"/>
  </g>
</svg>`;
}

await mkdir(destino, { recursive: true });

const png = (nombre, opciones) =>
  sharp(Buffer.from(svg(opciones))).png().toFile(join(destino, nombre));

// El ícono de la app lleva el fondo verde: iOS no admite transparencia y Android lo usa de
// fallback cuando no hay ícono adaptativo.
//
// Nota: el assets/icon.png anterior era en realidad un WebP renombrado a .png (sus magic bytes
// eran RIFF…WEBP). Expo lo aceptaba en desarrollo pero es un formato que el pipeline de build
// no tiene por qué digerir. Este sí es un PNG.
await png('icon.png', { lado: 1024, escala: 0.62, fondo: true });

// Capa de frente del ícono adaptativo de Android: transparente y con el glifo más chico,
// porque el sistema recorta hasta un 33% del borde según la forma del launcher. El fondo lo
// pone app.config.ts con adaptiveIcon.backgroundColor.
await png('adaptive-icon.png', { lado: 1024, escala: 0.42, fondo: false });

await png('splash-icon.png', { lado: 512, escala: 0.55, fondo: false });
await png('favicon.png', { lado: 48, escala: 0.8, fondo: true });

console.log('mobile/assets: icon.png (1024), adaptive-icon.png (1024), splash-icon.png (512), favicon.png (48)');

// Las láminas botánicas. Los originales son PNG de 928x1137 y ~1,7 MB cada uno; a 760 px de
// ancho alcanzan de sobra para el hero del login en un teléfono y pesan una fracción.
//
// Se quedan en PNG (y no WebP como en la web) porque el <Image> de React Native no decodifica
// WebP en iOS sin sumar expo-image. El canal alfa es imprescindible: las plantas van recortadas
// flotando sobre el degradado verde, no dentro de una caja.
const ANCHO_LAMINA = 760;
const LAMINAS = ['auth-login', 'auth-register', 'auth-recovery'];

for (const nombre of LAMINAS) {
  const info = await sharp(join(raiz, 'assets-fuente', `${nombre}.png`))
    .resize({ width: ANCHO_LAMINA, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(destino, `${nombre}.png`));
  console.log(`mobile/assets/${nombre}.png  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
