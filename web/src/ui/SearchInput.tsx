import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import { IconSearch } from './icons';

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className, ...rest }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        className={cn(
          'w-full h-10 pl-9 pr-3.5 bg-surface rounded-pill text-sm text-slate-900 placeholder:text-slate-400',
          'shadow-xs ring-1 ring-inset ring-slate-200',
          'outline-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:shadow-focus',
          'transition-shadow duration-150',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
        {...rest}
      />
    </div>
  );
}
