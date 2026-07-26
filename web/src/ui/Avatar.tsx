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
        'rounded-full bg-mint-grad text-rail grid place-items-center font-bold select-none shrink-0 shadow-xs',
        size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-9 h-9 text-xs',
        className,
      )}
    >
      {iniciales(nombre, apellido) || '·'}
    </div>
  );
}
