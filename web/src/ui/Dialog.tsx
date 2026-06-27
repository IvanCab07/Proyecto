import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
import { overlayFade, dialogPop } from '../lib/motion';
import { IconX } from './icons';

type Size = 'sm' | 'md' | 'lg';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: Size;
  footer?: ReactNode;
  children: ReactNode;
}

const SIZE: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Dialog({ open, onClose, title, description, size = 'md', footer, children }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // onClose suele venir como función nueva en cada render (onClose={() => setX(null)}).
  // Lo guardamos en un ref para que el efecto de abajo dependa solo de `open` y no se
  // re-ejecute en cada tecla robándole el foco a los inputs del modal.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              ref={panelRef}
              variants={dialogPop}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className={cn(
                'pointer-events-auto w-full bg-surface rounded-card shadow-modal outline-none my-auto',
                SIZE[size],
              )}
            >
              <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
                <div>
                  <h2 id={titleId} className="text-base font-semibold text-slate-900 tracking-tightish">
                    {title}
                  </h2>
                  {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="p-1.5 -m-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150"
                >
                  <IconX />
                </button>
              </div>
              <div className="px-5 py-4">{children}</div>
              {footer && (
                <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
