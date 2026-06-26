import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients } from '../../lib/theme';
import { PressableScale } from '../../lib/motion';
import { IconArrowLeft } from './Icon';

// Hero/encabezado de pantalla con gradiente oscuro (rail) o teal (brand).
export function ScreenHeader({
  title, subtitle, eyebrow, right, onBack, children, variant = 'rail', pb,
}: {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  right?: ReactNode;
  onBack?: () => void;
  children?: ReactNode;
  variant?: 'rail' | 'brand';
  /** Padding inferior del contenido (px). Subir cuando una tarjeta flota por encima del header. */
  pb?: number;
}) {
  const insets = useSafeAreaInsets();
  const grad = variant === 'brand' ? gradients.brand : gradients.railHero;
  return (
    <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 10 }}>
      <View className="px-5 pt-1" style={{ paddingBottom: pb ?? 20 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            {onBack ? (
              <PressableScale onPress={onBack} haptic="select" className="w-9 h-9 -ml-1 mb-2 rounded-full items-center justify-center bg-white/10">
                <IconArrowLeft size={18} color="#fff" />
              </PressableScale>
            ) : null}
            {eyebrow ? <Text className="text-brand-300 text-[11px] font-bold uppercase tracking-widest">{eyebrow}</Text> : null}
            {title ? <Text className="text-white text-[26px] font-bold mt-0.5" style={{ letterSpacing: -0.5 }}>{title}</Text> : null}
            {subtitle ? <Text className="text-slate-300 text-sm mt-1">{subtitle}</Text> : null}
          </View>
          {right ? <View className="ml-3">{right}</View> : null}
        </View>
        {children ? <View className="mt-4">{children}</View> : null}
      </View>
    </LinearGradient>
  );
}
