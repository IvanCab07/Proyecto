import { Text } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { PressableScale } from '../../lib/motion';

// Chip seleccionable (filtros, especialidades). Activo = teal sólido.
export function Chip({
  label, active, onPress, icon, tone = 'brand',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  tone?: 'brand' | 'dark';
}) {
  const activeBg = tone === 'dark' ? 'bg-rail border-rail' : 'bg-brand-600 border-brand-600';
  return (
    <PressableScale
      haptic="select"
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 px-4 h-9 rounded-pill border',
        active ? activeBg : 'bg-surface border-slate-200',
      )}
    >
      {icon}
      <Text className={cn('text-[13px] font-semibold', active ? 'text-white' : 'text-slate-600')}>{label}</Text>
    </PressableScale>
  );
}
