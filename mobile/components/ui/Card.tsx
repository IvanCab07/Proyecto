import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { cn } from '../../lib/cn';
import { shadow } from '../../lib/theme';

// Superficie blanca elevada sobre el lienzo tintado.
export function Card({ className, style, children, flat, ...rest }: ViewProps & { className?: string; flat?: boolean }) {
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
