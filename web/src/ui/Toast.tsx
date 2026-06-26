import { Toaster, resolveValue } from 'react-hot-toast';
import type { Toast as HotToast } from 'react-hot-toast';
import { motion } from 'motion/react';
import { SPRING, EASE, DUR } from '../lib/motion';
import { Spinner } from './Spinner';
import { IconCheck, IconAlert } from './icons';

function ToastIcon({ type }: { type: HotToast['type'] }) {
  if (type === 'success') {
    return (
      <span className="w-6 h-6 rounded-full bg-success-soft text-success-text grid place-items-center shrink-0">
        <IconCheck className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (type === 'error') {
    return (
      <span className="w-6 h-6 rounded-full bg-danger-soft text-danger-text grid place-items-center shrink-0">
        <IconAlert className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (type === 'loading') {
    return (
      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 grid place-items-center shrink-0">
        <Spinner size={13} />
      </span>
    );
  }
  return null;
}

export function AppToaster() {
  return (
    <Toaster position="top-right" gutter={10} toastOptions={{ duration: 3500 }}>
      {(t) => (
        <motion.div
          initial={{ opacity: 0, x: 16, scale: 0.97 }}
          animate={
            t.visible
              ? { opacity: 1, x: 0, scale: 1, transition: SPRING.gentle }
              : { opacity: 0, x: 8, scale: 0.97, transition: { duration: DUR.fast, ease: EASE.in } }
          }
          className="pointer-events-auto flex items-start gap-3 w-80 max-w-[calc(100vw-32px)] bg-surface rounded-card shadow-pop ring-1 ring-slate-200/70 px-4 py-3.5"
        >
          <ToastIcon type={t.type} />
          <div className="text-sm font-medium text-slate-800 leading-snug pt-0.5 min-w-0 [overflow-wrap:anywhere]">
            {resolveValue(t.message, t)}
          </div>
        </motion.div>
      )}
    </Toaster>
  );
}
