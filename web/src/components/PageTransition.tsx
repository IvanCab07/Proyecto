import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { fadeInUp } from '../lib/motion';

// Entrada estándar de página: fade + leve subida, sin animación de salida entre rutas.
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}
