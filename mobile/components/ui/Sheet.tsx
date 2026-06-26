import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Modal, View, Text, Pressable, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DUR, EASE, SPRING } from '../../lib/motion';
import { colors } from '../../lib/theme';
import { IconX } from './Icon';

// Bottom-sheet arrastrable (drag-to-dismiss) con backdrop que se atenúa con el arrastre.
export function Sheet({
  visible, onClose, title, children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ty = useSharedValue(height);

  useEffect(() => {
    if (visible) ty.value = withSpring(0, SPRING.gentle);
  }, [visible]);

  const close = () => {
    ty.value = withTiming(height, { duration: DUR.base * 1000, easing: EASE.in }, (fin) => {
      if (fin) runOnJS(onClose)();
    });
  };

  const pan = Gesture.Pan()
    .onUpdate(e => { ty.value = Math.max(0, e.translationY); })
    .onEnd(e => {
      if (e.translationY > 130 || e.velocityY > 850) {
        ty.value = withTiming(height, { duration: 200, easing: EASE.in }, (fin) => { if (fin) runOnJS(onClose)(); });
      } else {
        ty.value = withSpring(0, SPRING.gentle);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ty.value, [0, height], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2,6,23,0.55)' }, backdropStyle]}>
            <Pressable style={{ flex: 1 }} onPress={close} />
          </Animated.View>

          <GestureDetector gesture={pan}>
            <Animated.View
              style={[sheetStyle, { paddingBottom: insets.bottom + 16 }]}
              className="bg-surface rounded-t-[28px]"
            >
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1.5 rounded-full bg-slate-300" />
              </View>
              {title ? (
                <View className="flex-row items-center justify-between px-5 pt-1 pb-3">
                  <Text className="text-lg font-bold text-slate-900">{title}</Text>
                  <Pressable onPress={close} hitSlop={10} className="w-8 h-8 rounded-full items-center justify-center bg-slate-100">
                    <IconX size={16} color={colors.slate[500]} />
                  </Pressable>
                </View>
              ) : null}
              <View className="px-5 pt-1">{children}</View>
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
