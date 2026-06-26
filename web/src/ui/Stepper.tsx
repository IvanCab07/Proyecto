import { Fragment } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import { DUR, EASE } from '../lib/motion';

interface StepperProps {
  steps: string[];
  current: number; // índice 0-based del paso activo
}

function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
      <motion.path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: DUR.slow, ease: EASE.out }}
      />
    </svg>
  );
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center gap-2.5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={label}>
            {i > 0 && (
              <div
                className={cn(
                  'h-px flex-1 min-w-4 transition-colors duration-300',
                  done || active ? 'bg-brand-500' : 'bg-slate-200',
                )}
              />
            )}
            <li className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
              <span
                className={cn(
                  'w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold transition-colors duration-200 tnum',
                  done && 'bg-brand-600 text-white',
                  active && 'bg-surface text-brand-700 ring-2 ring-brand-600',
                  !done && !active && 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <CheckMark /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-[13px] font-medium hidden sm:block whitespace-nowrap transition-colors duration-200',
                  active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
