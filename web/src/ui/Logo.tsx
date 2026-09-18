import { cn } from '../lib/cn';

/**
 * Nombre del producto. Está acá y en ningún otro lado: antes el string "Hospital" estaba
 * escrito a mano en el sidebar y en las pantallas de auth.
 */
export const MARCA = 'Vitalis';

/**
 * Geometría de la marca: cruz médica de trazo con una línea de latido atravesándola.
 *
 * Se exportan las paths porque el favicon se genera a partir de ellas con
 * `node scripts/gen-favicon.mjs`. Antes public/favicon.svg era una copia hecha a mano y se
 * desincronizaba en cuanto alguien tocaba el símbolo.
 *
 * El trazo es grueso (2 / 1.9 sobre un viewBox de 24) a propósito: a 16px, que es el tamaño
 * real en la pestaña del navegador, un trazo fino se empasta y la cruz se lee como un cuadrado.
 */
export const CRUZ_PATH =
  'M10 3H14A2.5 2.5 0 0 1 16.5 5.5V6A1.5 1.5 0 0 0 18 7.5H18.5A2.5 2.5 0 0 1 21 10V14A2.5 2.5 0 0 1 18.5 16.5H18A1.5 1.5 0 0 0 16.5 18V18.5A2.5 2.5 0 0 1 14 21H10A2.5 2.5 0 0 1 7.5 18.5V18A1.5 1.5 0 0 0 6 16.5H5.5A2.5 2.5 0 0 1 3 14V10A2.5 2.5 0 0 1 5.5 7.5H6A1.5 1.5 0 0 0 7.5 6V5.5A2.5 2.5 0 0 1 10 3Z';

// Latido simplificado: un solo pico alto y un valle, en vez de los cuatro dientes que tenía
// antes. A tamaño chico los dientes se fundían en una línea recta y no se leía como un ECG.
export const LATIDO_PATH = 'M4.6 12.4H9.1L11.4 6.6L13.6 17.2L15.1 12.4H19.4';

export const CRUZ_ANCHO = 2;
export const LATIDO_ANCHO = 1.9;

// Usa currentColor, así sirve en blanco sobre el rail verde y en color de marca sobre fondo
// claro, en ambos temas.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-6 h-6', className)}
      aria-hidden="true"
    >
      <path strokeWidth={CRUZ_ANCHO} d={CRUZ_PATH} />
      <path strokeWidth={LATIDO_ANCHO} d={LATIDO_PATH} />
    </svg>
  );
}

type BadgeSize = 'sm' | 'md' | 'lg';

const BADGE: Record<BadgeSize, { box: string; glyph: string }> = {
  sm: { box: 'w-9 h-9  rounded-xl',  glyph: 'w-[22px] h-[22px]' },
  md: { box: 'w-11 h-11 rounded-2xl', glyph: 'w-7 h-7' },
  lg: { box: 'w-12 h-12 rounded-2xl', glyph: 'w-8 h-8' },
};

// Logo dentro de la pastilla menta del sistema EMS (sidebar, auth, carga).
export function LogoBadge({ size = 'md', className }: { size?: BadgeSize; className?: string }) {
  const s = BADGE[size];
  return (
    <div
      className={cn(
        'grid place-items-center shrink-0 bg-mint-grad text-rail shadow-glow-mint',
        s.box,
        className,
      )}
    >
      <Logo className={s.glyph} />
    </div>
  );
}

/** Pastilla + nombre. Es la firma de la marca: sidebar, pantallas de auth, receta impresa. */
export function LogoWordmark({
  size = 'sm',
  subtitulo,
  className,
}: {
  size?: BadgeSize;
  subtitulo?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 min-w-0', className)}>
      <LogoBadge size={size} />
      <div className="min-w-0">
        <p className="font-semibold tracking-tightish truncate leading-tight">{MARCA}</p>
        {subtitulo && <p className="text-[11px] opacity-70 truncate leading-tight mt-0.5">{subtitulo}</p>}
      </div>
    </div>
  );
}
