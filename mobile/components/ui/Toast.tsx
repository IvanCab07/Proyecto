import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/useTheme';
import { haptic } from '../../lib/haptics';
import { IconCheckCircle, IconAlertCircle, IconInfo } from './Icon';

// Avisos breves (éxito / error / info) con el diseño de la app. Reemplazan los
// Alert.alert de "resultado". API tipo objeto global para llamarlos desde cualquier lado:
//   toast.success('Guardado'); toast.error('No se pudo'); toast.info('…');

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; text: string };

const ICONO: Record<ToastKind, typeof IconInfo> = {
  success: IconCheckCircle,
  error:   IconAlertCircle,
  info:    IconInfo,
};

let _push: ((kind: ToastKind, text: string) => void) | null = null;
export const toast = {
  success: (text: string) => _push?.('success', text),
  error:   (text: string) => _push?.('error', text),
  info:    (text: string) => _push?.('info', text),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors, shadow } = useTheme();
  const [items, setItems] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();
  const idRef = useRef(0);

  const TONE: Record<ToastKind, string> = {
    success: colors.success.DEFAULT,
    error:   colors.danger.DEFAULT,
    info:    colors.info.DEFAULT,
  };

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = ++idRef.current;
    haptic[kind === 'success' ? 'success' : kind === 'error' ? 'error' : 'light']();
    setItems((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2800);
  }, []);
  _push = push;

  return (
    <>
      {children}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12 }}
      >
        {items.map((t) => {
          const Icon = ICONO[t.kind];
          const color = TONE[t.kind];
          return (
            <Animated.View
              key={t.id}
              entering={FadeInUp.duration(220)}
              exiting={FadeOutUp.duration(160)}
              style={[shadow.pop, { marginBottom: 8 }]}
              className="flex-row items-center gap-2.5 bg-surface rounded-card px-4 py-3.5"
            >
              <Icon size={20} color={color} />
              <Text className="flex-1 text-[14px] font-semibold text-slate-800">{t.text}</Text>
            </Animated.View>
          );
        })}
      </View>
    </>
  );
}
