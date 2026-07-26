import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
import { IconChevronDown, IconEye, IconEyeOff } from './icons';

interface FieldChrome {
  label?: string;
  hint?: string;
  error?: string;
}

interface FieldProps extends FieldChrome {
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, htmlFor, required, className, children }: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[13px] font-medium text-danger overflow-hidden"
          >
            <span className="block pt-1.5">{error}</span>
          </motion.p>
        ) : hint ? (
          <p className="text-[13px] text-slate-400 pt-1.5">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const fieldBase = cn(
  'w-full bg-surface rounded-field text-sm text-slate-900 placeholder:text-slate-400',
  'shadow-xs ring-1 ring-inset ring-slate-200',
  'outline-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:shadow-focus',
  'transition-shadow duration-150',
  'disabled:opacity-60 disabled:bg-slate-50',
);

const fieldError = 'ring-danger focus:ring-danger';

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldChrome;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} required={required} className={className}>
      <input
        ref={ref}
        id={inputId}
        required={required}
        className={cn(fieldBase, 'h-10 px-3.5', error && fieldError)}
        {...rest}
      />
    </Field>
  );
});

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & FieldChrome;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, hint, error, className, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} required={required} className={className}>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          required={required}
          type={visible ? 'text' : 'password'}
          className={cn(fieldBase, 'h-10 pl-3.5 pr-10', error && fieldError)}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setVisible(v => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 transition-colors duration-150"
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldChrome;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, required, children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={selectId} required={required} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={cn(fieldBase, 'h-10 pl-3.5 pr-9 appearance-none cursor-pointer', error && fieldError)}
          {...rest}
        >
          {children}
        </select>
        <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </Field>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChrome;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, required, rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={textareaId} required={required} className={className}>
      <textarea
        ref={ref}
        id={textareaId}
        required={required}
        rows={rows}
        className={cn(fieldBase, 'px-3.5 py-2.5 resize-none', error && fieldError)}
        {...rest}
      />
    </Field>
  );
});
