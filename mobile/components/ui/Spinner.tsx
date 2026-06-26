import { useEffect } from 'react';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { colors } from '../../lib/theme';

// Construye el color del "track" con ~15% de opacidad (alpha 0x26).
// Soporta hex de 3 dígitos (#fff) y de 6 (#14B8A6); otros formatos se usan tal cual.
function trackColor(color: string): string {
  const full = /^#[0-9a-fA-F]{3}$/.test(color)
    ? '#' + color.slice(1).split('').map((c) => c + c).join('')
    : color;
  return /^#[0-9a-fA-F]{6}$/.test(full) ? `${full}26` : full;
}

// Spinner por rotación continua (solo transform → UI thread).
export function Spinner({ size = 20, color = colors.brand[500], track }: { size?: number; color?: string; track?: string }) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rot);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value * 360}deg` }] }));
  const bw = Math.max(2, Math.round(size * 0.12));
  return (
    <Animated.View
      style={[
        {
          width: size, height: size, borderRadius: size / 2, borderWidth: bw,
          borderColor: track ?? trackColor(color), borderTopColor: color,
        },
        style,
      ]}
    />
  );
}
