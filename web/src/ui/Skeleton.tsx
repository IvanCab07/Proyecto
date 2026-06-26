import type { CSSProperties } from 'react';
import { cn } from '../lib/cn';
import { Card } from './Card';

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        'animate-shimmer rounded-md bg-slate-100',
        'bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 bg-[length:400px_100%]',
        className,
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 max-w-[120px]" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn('h-3.5 flex-1', c === 0 && 'max-w-[180px]')} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SkeletonStatCard() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-16" />
    </Card>
  );
}

export function SkeletonChart({ height = 280 }: { height?: number }) {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-40 mb-5" />
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </Card>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-20 rounded-pill" />
          </div>
          <SkeletonText lines={2} />
        </Card>
      ))}
    </div>
  );
}
