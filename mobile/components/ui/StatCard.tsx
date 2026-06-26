import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { shadow } from '../../lib/theme';
import { AnimatedNumber, PressableScale } from '../../lib/motion';

type Tone = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONE: Record<Tone, { card: string; chip: string; value: string }> = {
  default: { card: 'bg-surface border-slate-100',     chip: 'bg-slate-100',           value: 'text-slate-900' },
  brand:   { card: 'bg-brand-50 border-brand-100',    chip: 'bg-brand-600',           value: 'text-brand-900' },
  success: { card: 'bg-success-soft border-success/20', chip: 'bg-success',           value: 'text-success-text' },
  warning: { card: 'bg-warning-soft border-warning/20', chip: 'bg-warning',           value: 'text-warning-text' },
  danger:  { card: 'bg-danger-soft border-danger/20', chip: 'bg-danger',              value: 'text-danger-text' },
  info:    { card: 'bg-info-soft border-info/20',     chip: 'bg-info',                value: 'text-info-text' },
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
  const t = TONE[tone];
  const boxClass = cn('rounded-card p-4 border', t.card);
  const content = (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[12px] font-medium text-slate-600 flex-1 mr-2" numberOfLines={1}>{label}</Text>
        {icon ? <View className={cn('w-9 h-9 rounded-xl items-center justify-center', t.chip)}>{icon}</View> : null}
      </View>
      <AnimatedNumber
        value={value}
        duration={animate ? 600 : 0}
        className={cn('text-[30px] font-bold', t.value)}
        style={{ fontVariant: ['tabular-nums'], letterSpacing: -1 }}
      />
    </>
  );

  return onPress ? (
    <PressableScale onPress={onPress} haptic="select" style={shadow.xs} className={boxClass}>{content}</PressableScale>
  ) : (
    <View style={shadow.xs} className={boxClass}>{content}</View>
  );
}
