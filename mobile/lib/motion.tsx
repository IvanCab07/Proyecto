import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AccessibilityInfo, Pressable, Text } from 'react-native';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { haptic, type HapticKind } from './haptics';

// Sistema de motion (espeja lib/motion.ts de la web). Regla: solo transform/opacity,
// entradas ease-out rápidas, salidas más cortas ease-in, springs para layout/gestos.

export const DUR = { fast: 0.15, base: 0.2, slow: 0.3, page: 0.35 } as const;

export const EASE = {
  out:     Easing.bezier(0.25, 1, 0.5, 1),    // ease-out-quart: entradas por defecto
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),    // superficies grandes (sheets)
  in:      Easing.bezier(0.55, 0, 1, 0.45),   // salidas cortas
} as const;

export const SPRING = {
  snappy: { damping: 35, stiffness: 550, mass: 1 },   // indicadores (tabs, segmentos)
  gentle: { damping: 28, stiffness: 280, mass: 1 },   // sheets, toasts
} as const;

// ---- Entradas reutilizables (con stagger por índice) ----
export const enterUp = (delay = 0) =>
  FadeInDown.duration(DUR.slow * 1000).delay(delay).easing(EASE.out);

export const enterFade = (delay = 0) =>
  FadeIn.duration(DUR.base * 1000).delay(delay);

export const exitFade = FadeOut.duration(DUR.fast * 1000);

// Stagger de lista: índice → delay escalonado.
export const stagger = (index: number, step = 45, base = 40) => enterUp(base + index * step);

// Re-exports cómodos.
export { Animated, LinearTransition };

// ---- prefers-reduced-motion ----
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { if (mounted) setReduced(v); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { mounted = false; sub?.remove?.(); };
  }, []);
  return reduced;
}

// ---- PressableScale: whileTap scale + háptico (espeja el Button de la web) ----
type PressableScaleProps = PressableProps & {
  scaleTo?: number;
  haptic?: HapticKind;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function PressableScale({
  scaleTo = 0.97,
  haptic: kind = 'light',
  className,
  style,
  children,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(e) => { scale.value = withTiming(scaleTo, { duration: 110, easing: EASE.out }); onPressIn?.(e); }}
      onPressOut={(e) => { scale.value = withSpring(1, SPRING.snappy); onPressOut?.(e); }}
      onPress={(e) => { if (kind && !disabled) haptic[kind](); onPress?.(e); }}
      {...rest}
    >
      <Animated.View style={[aStyle, style]} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---- AnimatedNumber: count-up para los StatCard ----
export function AnimatedNumber({
  value,
  duration = 600,
  className,
  style,
}: {
  value: number;
  duration?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced || duration <= 0) { setDisplay(value); return; }
    const from = 0;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return <Text className={className} style={style}>{display}</Text>;
}
