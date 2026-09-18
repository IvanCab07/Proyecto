import { View, Text } from 'react-native';
import { cn } from '../../lib/cn';
import { useTheme } from '../../lib/useTheme';
import { IconCheck } from './Icon';

// Progreso de pasos: círculo centrado en cada celda, conectores simétricos a los lados,
// etiqueta centrada debajo del círculo.
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const { colors } = useTheme();
  const last = steps.length - 1;
  return (
    <View className="flex-row">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const leftOn = i > 0 && current >= i;
        const rightOn = i < last && current >= i + 1;
        return (
          <View key={label} className="flex-1 items-center">
            <View className="flex-row items-center w-full">
              <View className="flex-1 h-[2px] rounded-full" style={{ backgroundColor: i === 0 ? 'transparent' : leftOn ? colors.brand[600] : colors.slate[200] }} />
              <View
                className={cn(
                  'w-8 h-8 rounded-full items-center justify-center border-2',
                  done ? 'bg-brand-600 border-brand-600' : active ? 'bg-surface border-brand-600' : 'bg-surface border-slate-200',
                )}
              >
                {done ? <IconCheck size={15} color="#fff" /> : <Text className={cn('text-[13px] font-bold', active ? 'text-brand-700' : 'text-slate-400')}>{i + 1}</Text>}
              </View>
              <View className="flex-1 h-[2px] rounded-full" style={{ backgroundColor: i === last ? 'transparent' : rightOn ? colors.brand[600] : colors.slate[200] }} />
            </View>
            <Text className={cn('text-[11px] font-semibold mt-1.5 text-center', active || done ? 'text-brand-700' : 'text-slate-400')} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
