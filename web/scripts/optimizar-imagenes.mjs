// Convierte las láminas de las pantallas de ingreso a WebP.
//
// Los PNG originales vienen a 928x1137 y pesan ~1,7 MB cada uno: 5,2 MB que se bajaban antes
// de ver el formulario de login, que es la primera pantalla de la app. En WebP quedan en
// ~1,1 MB entre las tres, sin diferencia visible.
//
// FLUJO: los originales viven en `assets-fuente/` y NO en `public/`, porque Vite copia todo
// lo que hay en public/ a dist/ tal cual y volveríamos a shippear los PNG al lado de los WebP.
// Este script lee de assets-fuente/ y escribe en public/. Nunca borra el original: si mañana
// hay que reencodear con otra calidad, la fuente sigue estando.
//
// IMPORTANTE: las láminas tienen fondo transparente a propósito (ver el comentario de
// src/pages/auth/AuthLayout.tsx). WebP conserva el canal alfa, por eso se usa ese formato y
// no JPG, que las metería dentro de una caja negra.
//
// Se corre a mano con `npm run imagenes` cuando se agrega o reemplaza una lámina, no en cada
// build: los .webp resultantes se commitean.

import { readdir, stat, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, parse } from 'node:path';
import sharp from 'sharp';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const fuente = join(raiz, 'assets-fuente');
const destinoDir = join(raiz, 'public');

/**
 * Calidad WebP. Por debajo de 76 el archivo casi no baja (277 KB a q70 contra 291 KB a q76)
 * pero la lámina empieza a mostrar bandas en los degradados de las hojas: no vale la pena.
 */
const CALIDAD = 80;

/**
 * Las láminas se muestran con `bg-contain` en un panel de media pantalla, así que a 928px de
 * ancho nativo ya están en el tamaño justo para un monitor de 1920. El resize solo actúa como
 * tope por si alguien deja caer una imagen mucho más grande.
 */
const ANCHO_MAXIMO = 1200;

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

await mkdir(destinoDir, { recursive: true });

let archivos = [];
try {
  archivos = (await readdir(fuente)).filter((n) => /\.(png|jpe?g)$/i.test(n));
} catch {
  console.error(`No encontré ${fuente}. Ahí van los originales de las láminas.`);
  process.exit(1);
}

if (archivos.length === 0) {
  console.log('No hay imágenes en assets-fuente/. Nada que hacer.');
  process.exit(0);
}

let antes = 0;
let despues = 0;

for (const nombre of archivos) {
  const origen = join(fuente, nombre);
  const destino = join(destinoDir, `${parse(nombre).name}.webp`);

  const pesoOriginal = (await stat(origen)).size;

  await sharp(origen)
    // `withoutEnlargement` para no reescalar hacia arriba una lámina que ya sea más chica.
    .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
    .webp({ quality: CALIDAD })
    .toFile(destino);

  const pesoNuevo = (await stat(destino)).size;

  antes += pesoOriginal;
  despues += pesoNuevo;

  const ahorro = (100 * (1 - pesoNuevo / pesoOriginal)).toFixed(0);
  console.log(`  ${nombre} → ${parse(destino).base}  ${kb(pesoOriginal)} → ${kb(pesoNuevo)}  (-${ahorro}%)`);
}

console.log(`\nTotal: ${kb(antes)} → ${kb(despues)} (-${(100 * (1 - despues / antes)).toFixed(0)}%)`);
