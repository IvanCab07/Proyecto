import { View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/useTheme';

interface StarsProps {
  /** Puntaje actual (1–5). En modo lectura usa el redondeo para pintar. */
  value: number;
  /** Si se pasa, las estrellas son interactivas (calificar). */
  onChange?: (value: number) => void;
  /** Tamaño de cada estrella en px (default 20). */
  size?: number;
  color?: string;
}

/**
 * Estrellas reutilizables (espeja web/src/ui/Stars.tsx). Sin `onChange` es de solo
 * lectura; con `onChange` permite elegir de 1 a 5 tocando.
 */
export function Stars({ value, onChange, size = 20, color }: StarsProps) {
  const { colors } = useTheme();
  const lleno = color ?? colors.amber[500];
  const vacio = colors.slate[300];
  const interactive = typeof onChange === 'function';
  const rounded = Math.round(value);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rounded;
        const icon = (
          <MaterialCommunityIcons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? lleno : vacio}
          />
        );
        if (!interactive) return <View key={n}>{icon}</View>;
        return (
          <Pressable key={n} onPress={() => onChange!(n)} hitSlop={6} style={{ padding: 2 }}>
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}
