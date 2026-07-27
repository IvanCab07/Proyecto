import { View, Text, Pressable } from 'react-native';
import { IconStar } from './Icon';
import { useTheme } from '../../lib/useTheme';
import { haptic } from '../../lib/haptics';

interface Props {
  /** Cuántas reseñas hay de cada puntaje (claves 1..5). */
  distribucion: Record<number, number>;
  /** Total de reseñas, para calcular el ancho de cada barra. */
  total: number;
  /** Puntaje del filtro activo, o null si se ven todas. */
  valor: number | null;
  /** Tocar la fila activa manda null (funciona como toggle). */
  onChange: (estrellas: number | null) => void;
}

const NIVELES = [5, 4, 3, 2, 1];

/**
 * Barras de distribución de puntajes, y a la vez el filtro de la lista de reseñas.
 *
 * Es el mismo patrón que ya usa la web en medico/Calificaciones.tsx: tocar una barra filtra,
 * tocar la activa limpia. El filtrado es en cliente, como todo el filtrado del proyecto.
 */
export function DistribucionEstrellas({ distribucion, total, valor, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View className="gap-1.5">
      {NIVELES.map(estrellas => {
        const cantidad = distribucion[estrellas] ?? 0;
        const pct = total > 0 ? Math.round((cantidad / total) * 100) : 0;
        const activo = valor === estrellas;
        const vacio = cantidad === 0;

        return (
          <Pressable
            key={estrellas}
            accessibilityRole="button"
            accessibilityState={{ selected: activo, disabled: vacio }}
            accessibilityLabel={`${cantidad} reseña${cantidad !== 1 ? 's' : ''} de ${estrellas} estrella${estrellas !== 1 ? 's' : ''}`}
            disabled={vacio}
            onPress={() => { haptic.select(); onChange(activo ? null : estrellas); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: activo ? colors.amber[50] : 'transparent',
              borderWidth: activo ? 1 : 0,
              borderColor: colors.amber[200],
              opacity: vacio ? 0.45 : 1,
            }}
          >
            <View className="flex-row items-center gap-1" style={{ width: 28 }}>
              <Text className="text-[12px] font-bold text-slate-600">{estrellas}</Text>
              <IconStar size={11} color={colors.amber[500]} />
            </View>

            <View
              style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.slate[100], overflow: 'hidden' }}
            >
              <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.amber[400] }} />
            </View>

            <Text className="text-[11px] text-slate-500" style={{ width: 56, textAlign: 'right' }}>
              {cantidad} · {pct}%
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
