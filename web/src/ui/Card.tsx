import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-surface rounded-card shadow-card ring-1 ring-inset ring-slate-200/60',
        'transition-shadow duration-300 hover:shadow-lift',
        className,
      )}
      {...rest}
    />
  );
}
