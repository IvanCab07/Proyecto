import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/cn';
import { useTheme } from '../../lib/useTheme';
import { PressableScale } from '../../lib/motion';
import { IconChevronRight } from './Icon';

// Filas de tarjeta: encabezado de sección, dato de solo lectura y fila navegable.
//
// Estaban copiadas textualmente al final de admin/ajustes, patient/perfil y medico/perfil, y
// se desincronizaban a cada retoque. Ahora viven acá y las usan también las pantallas «Menú».

/** Título de sección con su pastilla de ícono. */
export function SectionHead({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <View className="w-8 h-8 rounded-lg bg-brand-50 items-center justify-center">{icon}</View>
      <Text className="text-[15px] font-bold text-slate-900">{title}</Text>
    </View>
  );
}

/** Etiqueta a la izquierda, valor a la derecha. Para datos que no se editan en el lugar. */
export function DataRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={cn('flex-row justify-between py-3', !last && 'border-b border-slate-100')}>
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className="text-slate-900 text-sm font-semibold">{value}</Text>
    </View>
  );
}

/** Fila que navega a otra pantalla. */
export function NavRow({
  icon, label, desc, onPress, last,
}: {
  icon: ReactNode;
  label: string;
  desc?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="select"
      className={cn('flex-row items-center gap-3 py-3', !last && 'border-b border-slate-100')}
    >
      <View className="w-9 h-9 rounded-lg bg-brand-50 items-center justify-center">{icon}</View>
      <View className="flex-1">
        <Text className="text-slate-900 text-sm font-semibold">{label}</Text>
        {desc ? <Text className="text-slate-400 text-[12px]">{desc}</Text> : null}
      </View>
      <IconChevronRight size={16} color={colors.slate[300]} />
    </PressableScale>
  );
}
