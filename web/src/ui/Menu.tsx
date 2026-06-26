import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
import { menuScale } from '../lib/motion';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  tone?: 'default' | 'danger';
  onSelect: () => void;
}

interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
  triggerLabel?: string;
}

export function Menu({ trigger, items, align = 'end', triggerLabel = 'Abrir menú' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150"
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={menuScale}
            initial="hidden"
            animate="visible"
            exit="hidden"
            role="menu"
            style={{ transformOrigin: align === 'end' ? 'top right' : 'top left' }}
            className={cn(
              'absolute z-40 top-full mt-1.5 min-w-[170px] py-1.5 bg-surface rounded-xl shadow-pop ring-1 ring-slate-200/70',
              align === 'end' ? 'right-0' : 'left-0',
            )}
          >
            {items.map(item => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); item.onSelect(); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-left transition-colors duration-100',
                  item.tone === 'danger'
                    ? 'text-danger hover:bg-danger-soft'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                {item.icon && <span className="text-current opacity-70">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
