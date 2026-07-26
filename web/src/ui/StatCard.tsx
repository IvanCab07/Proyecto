import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { cn } from '../lib/cn';
import { EASE } from '../lib/motion';

type Tone = 'default' | 'brand' | 'accent' | 'success' | 'warning' | 'danger';

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  tone?: Tone;
  hint?: string;
}

// Sistema EMS: los tonos de marca son tarjetas en degradado verde bosque con
// texto claro y chip menta; los semánticos mantienen su lectura por estado.
const TONE: Record<Tone, { card: string; chip: string; value: string; label: string; hint: string }> = {
  default: {
    card:  'bg-surface ring-slate-200/70',
    chip:  'bg-slate-100 text-slate-600',
    value: 'text-slate-900', label: 'text-slate-600', hint: 'text-slate-500',
  },
  brand: {
    card:  'gradient-card ring-white/10',
    chip:  'bg-mint-grad text-rail',
    value: 'text-rail-fg', label: 'text-rail-fg/70', hint: 'text-rail-fg/60',
  },
  accent: {
    card:  'bg-brand-50 ring-brand-200/70',
    chip:  'bg-gradient-to-br from-brand-600 to-brand-700 text-white',
    value: 'text-brand-900', label: 'text-brand-800', hint: 'text-brand-800/80',
  },
  success: {
    card:  'bg-success-soft ring-success/20',
    chip:  'bg-success text-white',
    value: 'text-success-text', label: 'text-success-text/80', hint: 'text-success-text/70',
  },
  warning: {
    card:  'bg-warning-soft ring-warning/20',
    chip:  'bg-warning text-white',
    value: 'text-warning-text', label: 'text-warning-text/80', hint: 'text-warning-text/70',
  },
  danger: {
    card:  'bg-danger-soft ring-danger/20',
    chip:  'bg-danger text-white',
    value: 'text-danger-text', label: 'text-danger-text/80', hint: 'text-danger-text/70',
  },
};

function AnimatedNumber({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = String(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.6,
      ease: EASE.outExpo,
      onUpdate: v => { node.textContent = String(Math.round(v)); },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span ref={ref} className="tnum">0</span>;
}

export function StatCard({ label, value, icon, tone = 'default', hint }: StatCardProps) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        'rounded-card p-5 ring-1 ring-inset shadow-card transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lift',
        t.card,
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className={cn('text-[13px] font-medium truncate', t.label)}>{label}</p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl grid place-items-center shrink-0 shadow-xs [&>svg]:w-[18px] [&>svg]:h-[18px]', t.chip)}>
            {icon}
          </div>
        )}
      </div>
      <p className={cn('text-[30px] leading-none font-bold tracking-tighter2', t.value)}>
        <AnimatedNumber value={value} />
      </p>
      {hint && <p className={cn('text-xs mt-2', t.hint)}>{hint}</p>}
    </div>
  );
}
