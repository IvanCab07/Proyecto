import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import { cn } from '../lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

// Primario en degradado verde EMS: el 600→700 mantiene el contraste con el
// texto blanco (el #22c55e puro no llega) sin perder la lectura de marca.
const VARIANT: Record<Variant, string> = {
  primary:   'bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-btn hover:from-brand-500 hover:to-brand-600 hover:shadow-glow-brand',
  secondary: 'bg-surface text-slate-700 ring-1 ring-inset ring-slate-200 shadow-xs hover:bg-slate-50 hover:text-slate-900 hover:ring-brand-300',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger:    'bg-danger text-white shadow-btn hover:brightness-110',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9  px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4   text-sm gap-2',
  lg: 'h-11 px-5   text-[15px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, iconLeft, iconRight, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-pill select-none',
        'transition-all duration-200 outline-none',
        'disabled:opacity-60 disabled:pointer-events-none',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <Spinner size={size === 'sm' ? 13 : 15} />
          </motion.span>
        ) : iconLeft ? (
          <motion.span
            key="icon"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            {iconLeft}
          </motion.span>
        ) : null}
      </AnimatePresence>
      {children as ReactNode}
      {iconRight && <span className="inline-flex">{iconRight}</span>}
    </motion.button>
  );
});
