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

// Cada tono pinta la tarjeta con un fondo suave + chip de ícono sólido,
// para que el dashboard se sienta lleno y con color (no vacío/blanco).
const TONE: Record<Tone, { card: string; chip: string; value: string }> = {
  default: { card: 'bg-surface ring-slate-200',      chip: 'bg-slate-100 text-slate-600',  value: 'text-slate-900' },
  brand:   { card: 'bg-brand-50 ring-brand-100',     chip: 'bg-brand-600 text-white',       value: 'text-brand-900' },
  accent:  { card: 'bg-brand-50 ring-brand-100',     chip: 'bg-brand-600 text-white',       value: 'text-brand-900' },
  success: { card: 'bg-success-soft ring-success/20', chip: 'bg-success text-white',         value: 'text-success-text' },
  warning: { card: 'bg-warning-soft ring-warning/20', chip: 'bg-warning text-white',         value: 'text-warning-text' },
  danger:  { card: 'bg-danger-soft ring-danger/20',  chip: 'bg-danger text-white',          value: 'text-danger-text' },
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
        'rounded-card p-5 ring-1 shadow-card transition-transform duration-200 hover:-translate-y-0.5',
        t.card,
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[13px] font-medium text-slate-600 truncate">{label}</p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl grid place-items-center shrink-0 shadow-xs [&>svg]:w-[18px] [&>svg]:h-[18px]', t.chip)}>
            {icon}
          </div>
        )}
      </div>
      <p className={cn('text-[30px] leading-none font-bold tracking-tighter2', t.value)}>
        <AnimatedNumber value={value} />
      </p>
      {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
    </div>
  );
}
