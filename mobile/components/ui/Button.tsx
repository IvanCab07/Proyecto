import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { cn } from '../../lib/cn';
import { PressableScale } from '../../lib/motion';
import { useTheme } from '../../lib/useTheme';
import type { HapticKind } from '../../lib/haptics';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BOX: Record<Variant, string> = {
  primary:   'bg-brand-600',
  secondary: 'bg-surface border border-slate-200',
  ghost:     'bg-transparent',
  danger:    'bg-danger',
};
const LABEL: Record<Variant, string> = {
  primary: 'text-white', secondary: 'text-slate-700', ghost: 'text-slate-600', danger: 'text-white',
};
const SIZE_BOX: Record<Size, string> = { sm: 'h-9 px-3.5', md: 'h-11 px-4', lg: 'h-[52px] px-5' };
const SIZE_TXT: Record<Size, string> = { sm: 'text-[13px]', md: 'text-[15px]', lg: 'text-base' };

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  haptic?: HapticKind;
  onPress?: () => void;
  className?: string;
  children?: ReactNode;
}

export function Button({
  variant = 'primary', size = 'md', loading = false, disabled = false,
  iconLeft, iconRight, fullWidth = false, haptic = 'medium', onPress, className, children,
}: ButtonProps) {
  const { colors, shadow } = useTheme();
  const isDisabled = disabled || loading;
  // El spinner tiene que contrastar con el fondo del botón: blanco sobre los sólidos, gris
  // medio sobre los que van sobre superficie.
  const spinColor = variant === 'primary' || variant === 'danger' ? '#fff' : colors.slate[600];
  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic={isDisabled ? false : haptic}
      style={variant === 'primary' || variant === 'danger' ? shadow.xs : undefined}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-field',
        SIZE_BOX[size], BOX[variant],
        fullWidth && 'w-full',
        isDisabled && 'opacity-60',
        className,
      )}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} color={spinColor} /> : iconLeft}
      {typeof children === 'string'
        ? <Text className={cn('font-semibold', SIZE_TXT[size], LABEL[variant])}>{children}</Text>
        : children}
      {!loading ? iconRight : null}
    </PressableScale>
  );
}
