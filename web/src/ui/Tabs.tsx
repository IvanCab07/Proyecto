import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import { SPRING } from '../lib/motion';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  const layoutId = useId();

  return (
    <div role="tablist" className={cn('flex items-center gap-1 border-b border-slate-200', className)}>
      {tabs.map(tab => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors duration-150',
              active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-pill text-[11px] font-semibold tnum',
                  active ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-500',
                )}
              >
                {tab.count}
              </span>
            )}
            {active && (
              <motion.div
                layoutId={layoutId}
                transition={SPRING.snappy}
                className="absolute inset-x-2 -bottom-px h-0.5 bg-brand-600 rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
