import { motion } from 'motion/react';
import { LogoBadge } from '../ui/Logo';

export function LoadingScreen() {
  return (
    <div className="min-h-screen grid place-items-center bg-canvas">
      <motion.div
        animate={{ opacity: [0.45, 1, 0.45], scale: [0.96, 1, 0.96] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Cargando"
      >
        <LogoBadge size="lg" />
      </motion.div>
    </div>
  );
}
