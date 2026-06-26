import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { cn } from '../../lib/cn';

// Placeholder de carga con pulso de opacidad (mejor que un spinner pelado).
export function Skeleton({ className, style }: { className?: string; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const aStyle = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[aStyle, style]} className={cn('bg-slate-200 rounded-card', className)} />;
}

// Skeleton listo para una tarjeta de estadística.
export function SkeletonStat() {
  return <Skeleton className="h-[104px] rounded-card" />;
}
