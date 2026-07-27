import { useState } from 'react';
import { cn } from '../lib/cn';
import { iniciales } from '../lib/format';
import { apiBaseUrl } from '../services/api';

interface AvatarProps {
  nombre?: string;
  apellido?: string;
  /** Ruta que devuelve la API ("/uploads/avatar-x.jpg") o URL absoluta. */
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 'squircle' = cuadrado redondeado, el que usan las pantallas de perfil. */
  shape?: 'circle' | 'squircle';
  className?: string;
}

const TAMANOS: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-2xl',
};

/**
 * Avatar del usuario: la foto si la tiene, y si no las iniciales sobre la pastilla menta.
 *
 * `shape` es una prop y no algo que se pase por `className` porque el `cn` del proyecto es un
 * join de strings, no tailwind-merge: un `rounded-2xl` de afuera no le gana al `rounded-full`
 * propio, gana el que quede último en el CSS generado.
 */
export function Avatar({ nombre, apellido, src, size = 'md', shape = 'circle', className }: AvatarProps) {
  // Los uploads son efímeros: si el archivo ya no está, mejor las iniciales que una imagen rota.
  const [falla, setFalla] = useState(false);

  const forma = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const url = src && !/^https?:\/\//i.test(src) ? `${apiBaseUrl}${src}` : src;

  if (url && !falla) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setFalla(true)}
        className={cn('object-cover shrink-0 shadow-xs bg-surface', forma, TAMANOS[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'bg-mint-grad text-rail grid place-items-center font-bold select-none shrink-0 shadow-xs',
        forma,
        TAMANOS[size],
        className,
      )}
    >
      {iniciales(nombre, apellido) || '·'}
    </div>
  );
}
