import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { cn } from '../../lib/cn';
import { useTheme } from '../../lib/useTheme';

// Superficie elevada sobre el lienzo tintado (blanca en claro, slate-800 en oscuro).
export function Card({ className, style, children, flat, ...rest }: ViewProps & { className?: string; flat?: boolean }) {
  const { shadow } = useTheme();
  return (
    <View
      style={[flat ? undefined : shadow.card, style]}
      className={cn('bg-surface rounded-card border border-slate-100', className)}
      {...rest}
    >
      {children}
    </View>
  );
}
