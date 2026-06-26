import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadow } from '../../lib/theme';

// Monograma "H+" idéntico al de la web (gradiente brand-400→600 + glow).
export function Logo({ size = 44, glow = true }: { size?: number; glow?: boolean }) {
  const radius = Math.round(size * 0.28);
  return (
    <LinearGradient
      colors={[colors.brand[400], colors.brand[600]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
        glow ? shadow.glowBrand : null,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: Math.round(size * 0.46), lineHeight: Math.round(size * 0.52) }}>
          H
        </Text>
        <Text style={{ color: colors.brand[100], fontWeight: '700', fontSize: Math.round(size * 0.30), lineHeight: Math.round(size * 0.36), marginTop: Math.round(size * 0.03) }}>
          +
        </Text>
      </View>
    </LinearGradient>
  );
}
