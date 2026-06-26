import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-surface rounded-card shadow-card', className)}
      {...rest}
    />
  );
}
