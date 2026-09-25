import { useState } from 'react';
import { cn } from '../lib/cn';

// Estrella SVG. `filled` la pinta llena; si no, queda como contorno.
function Star({ filled, size, className }: { filled: boolean; size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.1 1.13-6.57L2.45 9.44l6.6-.96L12 2.5z" />
    </svg>
  );
}

interface StarsProps {
  /** Puntaje actual (1–5). En modo lectura usa el redondeo para pintar. */
  value: number;
  /** Si se pasa, las estrellas son interactivas (calificar). */
  onChange?: (value: number) => void;
  /** Tamaño de cada estrella en px (default 20). */
  size?: number;
  className?: string;
  /** Muestra el número al lado (ej "4.5"). */
  showValue?: boolean;
}

/**
 * Estrellas reutilizables. Sin `onChange` es de solo lectura (muestra un promedio/puntaje);
 * con `onChange` permite elegir de 1 a 5 con hover.
 */
export function Stars({ value, onChange, size = 20, className, showValue }: StarsProps) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  const activo = hover || value;

  return (
    <div className={cn('inline-flex items-center gap-0.5 text-amber-400', className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(activo);
        if (!interactive) {
          return <Star key={n} filled={filled} size={size} className={cn(!filled && 'text-slate-300')} />;
        }
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            onClick={() => onChange!(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 rounded transition-transform duration-100 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Star filled={filled} size={size} className={cn(!filled && 'text-slate-300')} />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold text-slate-700 tnum">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
