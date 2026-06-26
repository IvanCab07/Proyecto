import type { Transition, Variants } from 'motion/react';

// Sistema de motion del rediseño "Teal Clinical Dashboard".
// Reglas: solo transform/opacity, entradas rápidas con ease-out,
// salidas más cortas que las entradas, springs solo para layout/gestos.

export const DUR = { fast: 0.15, base: 0.2, slow: 0.3, page: 0.35 } as const;

export const EASE = {
  out:     [0.25, 1, 0.5, 1],   // ease-out-quart: entradas por defecto
  outExpo: [0.16, 1, 0.3, 1],   // superficies grandes (dialog, drawer)
  in:      [0.55, 0, 1, 0.45],  // salidas cortas
} as const;

export const SPRING = {
  snappy: { type: 'spring', stiffness: 550, damping: 35 },  // layoutId (tabs, nav)
  gentle: { type: 'spring', stiffness: 280, damping: 28 },  // drawer, toasts
} as const satisfies Record<string, Transition>;

export const fadeInUp: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.slow * 0.83, ease: EASE.out } },
};

export const overlayFade: Variants = {
  hidden:  { opacity: 0, transition: { duration: DUR.fast, ease: 'linear' } },
  visible: { opacity: 1, transition: { duration: DUR.base, ease: 'linear' } },
};

export const dialogPop: Variants = {
  hidden: {
    opacity: 0, scale: 0.96, y: 8,
    transition: { duration: DUR.fast, ease: EASE.in },
  },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: DUR.base, ease: EASE.outExpo },
  },
  exit: {
    opacity: 0, scale: 0.98, y: 4,
    transition: { duration: DUR.fast, ease: EASE.in },
  },
};

export const menuScale: Variants = {
  hidden: {
    opacity: 0, scale: 0.95,
    transition: { duration: DUR.fast * 0.67, ease: EASE.in },
  },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: DUR.fast, ease: EASE.out },
  },
};

// Panel anclado a una esquina superior (notificaciones): nace desde arriba.
export const panelScale: Variants = {
  hidden: {
    opacity: 0, scale: 0.96, y: -6,
    transition: { duration: DUR.fast, ease: EASE.in },
  },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: DUR.base, ease: EASE.out },
  },
};

export const listContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

export const listItem: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.out } },
};

// Pasos del wizard: dirección 1 (avanzar) o -1 (retroceder).
export const wizardStep: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: {
    opacity: 1, x: 0,
    transition: { duration: DUR.base, ease: EASE.out },
  },
  exit: (dir: number) => ({
    opacity: 0, x: dir * -24,
    transition: { duration: DUR.fast, ease: EASE.in },
  }),
};
