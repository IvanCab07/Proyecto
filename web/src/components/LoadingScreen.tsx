import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen grid place-items-center bg-canvas">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.96, 1, 0.96] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white grid place-items-center font-bold text-xl leading-none select-none shadow-glow-brand"
        aria-label="Cargando"
      >
        H<span className="text-brand-100 text-base">+</span>
      </motion.div>
    </div>
  );
}
