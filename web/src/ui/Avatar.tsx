import { cn } from '../lib/cn';
import { iniciales } from '../lib/format';

interface AvatarProps {
  nombre?: string;
  apellido?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Avatar({ nombre, apellido, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-items-center font-semibold select-none shrink-0 shadow-xs',
        size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-9 h-9 text-xs',
        className,
      )}
    >
      {iniciales(nombre, apellido) || '·'}
    </div>
  );
}
