import { View, Text } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { formatFechaCorta } from '../../lib/format';

// Columna de hora de las tarjetas de turno: la hora grande arriba y la fecha corta abajo.
//
// Reemplaza la franja de color de 4 px que las tres listas de turnos (admin, médico, paciente)
// tenían pegada a la izquierda. La hora es el dato por el que se escanea una lista de turnos, y
// alinearla en una columna fija deja leer la agenda de un vistazo en vez de tener que buscarla
// dentro del texto de cada tarjeta. El estado sigue estando, en el StatusBadge.

export function HoraTurno({ hora, fecha }: { hora: string; fecha: string }) {
  const { colors } = useTheme();
  return (
    <View
      className="w-[66px] items-center justify-center py-4 px-1"
      style={{ borderRightWidth: 1, borderRightColor: colors.slate[100] }}
    >
      <Text
        className="text-[17px] font-bold text-slate-900"
        style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.34 }}
      >
        {hora}
      </Text>
      <View className="w-5 h-px my-1.5" style={{ backgroundColor: colors.slate[200] }} />
      <Text className="text-[11px] font-semibold text-slate-400 capitalize" numberOfLines={1}>
        {formatFechaCorta(fecha)}
      </Text>
    </View>
  );
}
