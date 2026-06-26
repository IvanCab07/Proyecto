import { View, Text } from 'react-native';
import { STATUS, type TurnoStatus } from '../../lib/theme';

// Pill con punto, color por estado (fuente única en lib/theme STATUS).
export function StatusBadge({ status, onDark = false }: { status: TurnoStatus; onDark?: boolean }) {
  const s = STATUS[status] ?? STATUS.PENDIENTE;
  return (
    <View
      className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-pill"
      style={{ backgroundColor: onDark ? 'rgba(255,255,255,0.16)' : s.pillBg }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: onDark ? '#fff' : s.dot }} />
      <Text className="text-xs font-semibold" style={{ color: onDark ? '#fff' : s.pillText }}>{s.label}</Text>
    </View>
  );
}
