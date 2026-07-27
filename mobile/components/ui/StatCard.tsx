import { View, Text } from 'react-native';
import { cloneElement, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useTheme } from '../../lib/useTheme';
import { AnimatedNumber, PressableScale } from '../../lib/motion';

type Tone = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

// Todas las tarjetas van sobre superficie: el color del tono queda solo en la pastilla del
// ícono. Antes cada tono tintaba el fondo y el número, y cuatro tarjetas juntas (el panel de
// admin) eran cuatro bloques de color compitiendo contra el lienzo — sobre todo en oscuro,
// donde los `-soft` son oscuros y se empastan con el fondo.
const CHIP: Record<Tone, string> = {
  default: 'bg-slate-100',
  brand:   'bg-brand-50',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger:  'bg-danger-soft',
  info:    'bg-info-soft',
};

export function StatCard({
  label, value, icon, tone = 'default', onPress, animate = true,
}: {
  label: string;
  value: number;
  icon?: ReactNode;
  tone?: Tone;
  onPress?: () => void;
  animate?: boolean;
}) {
  const { colors, shadow } = useTheme();

  // El ícono se pinta con el color del tono; el que se pasa por props se ignora a propósito
  // para que no queden íconos blancos sobre pastillas claras.
  const iconColor: Record<Tone, string> = {
    default: colors.slate[500],
    brand:   colors.brand[600],
    success: colors.success.text,
    warning: colors.warning.text,
    danger:  colors.danger.text,
    info:    colors.info.text,
  };

  const boxClass = 'bg-surface rounded-card p-4 border border-slate-100';
  const content = (
    <>
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-1 mr-2" numberOfLines={1}>
          {label}
        </Text>
        {icon ? (
          <View className={cn('w-7 h-7 rounded-lg items-center justify-center', CHIP[tone])}>
            {/* Las pantallas siguen pasando el ícono en blanco, de cuando la pastilla era
                sólida. Se le reescribe el color acá para no tocar cada `icon={...}`. */}
            {isValidElement<{ color?: string; size?: number }>(icon)
              ? cloneElement(icon, { color: iconColor[tone], size: 15 })
              : icon}
          </View>
        ) : null}
      </View>
      <AnimatedNumber
        value={value}
        duration={animate ? 600 : 0}
        className="text-[28px] font-bold text-slate-900"
        style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.9 }}
      />
    </>
  );

  return onPress ? (
    <PressableScale onPress={onPress} haptic="select" style={shadow.xs} className={boxClass}>{content}</PressableScale>
  ) : (
    <View style={shadow.xs} className={boxClass}>{content}</View>
  );
}
