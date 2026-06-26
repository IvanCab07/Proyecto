import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)} {...rest} />
    </div>
  );
}

export function THead({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-slate-50/70', className)} {...rest}>
      <tr className="border-b border-slate-200">{children}</tr>
    </thead>
  );
}

interface THProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right';
}

export function TH({ align = 'left', className, ...rest }: THProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
      {...rest}
    />
  );
}

export function TBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-slate-100', className)} {...rest} />;
}

interface TRProps extends HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export function TR({ interactive, className, ...rest }: TRProps) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100 hover:bg-slate-50',
        interactive && 'cursor-pointer',
        className,
      )}
      {...rest}
    />
  );
}

interface TDProps extends TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function TD({ numeric, className, ...rest }: TDProps) {
  return (
    <td
      className={cn(
        'px-4 py-3.5 text-slate-700 align-middle',
        numeric && 'text-right tnum',
        className,
      )}
      {...rest}
    />
  );
}
