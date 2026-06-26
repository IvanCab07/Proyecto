import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../lib/theme';
import { iniciales } from '../../lib/format';

// Avatar con iniciales sobre gradiente teal.
export function Avatar({ nombre, apellido, size = 40 }: { nombre?: string; apellido?: string; size?: number }) {
  return (
    <LinearGradient
      colors={[colors.brand[400], colors.brand[600]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: Math.round(size * 0.38) }}>
        {iniciales(nombre, apellido)}
      </Text>
    </LinearGradient>
  );
}
