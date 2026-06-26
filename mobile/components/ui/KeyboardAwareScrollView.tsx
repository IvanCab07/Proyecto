import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView, KeyboardAvoidingView, Keyboard, Platform, TextInput, Dimensions,
} from 'react-native';
import type { ScrollViewProps } from 'react-native';

// ScrollView que mantiene el TextInput enfocado visible sobre el teclado.
// iOS: lo resuelve KeyboardAvoidingView (behavior padding). Android: en Expo Go no se
// respeta el windowSoftInputMode del manifest, así que escuchamos el teclado y scrolleamos
// el input enfocado por JS. Sin módulos nativos → funciona en Expo Go.
export function KeyboardAwareScrollView({ children, contentContainerStyle, ...props }: ScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetY = useRef(0);                 // offset actual del scroll (para sumarle el solape)
  const [kbHeight, setKbHeight] = useState(0);

  const scrollFocusedIntoView = useCallback((height: number) => {
    const input = TextInput.State.currentlyFocusedInput?.() as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null;
    const scroll = scrollRef.current;
    if (!input?.measureInWindow || !scroll) return;
    input.measureInWindow((_x, y, _w, h) => {
      const keyboardTop = Dimensions.get('window').height - height;
      const overlap = (y + h + 20) - keyboardTop;       // 20px de aire debajo del input
      if (overlap > 0) scroll.scrollTo({ y: offsetY.current + overlap, animated: true });
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;              // iOS ya lo maneja KeyboardAvoidingView
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKbHeight(e.endCoordinates.height);
      // pequeño delay para que el paddingBottom ya dé lugar a scrollear
      setTimeout(() => scrollFocusedIntoView(e.endCoordinates.height), 50);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, [scrollFocusedIntoView]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => { offsetY.current = e.nativeEvent.contentOffset.y; }}
        contentContainerStyle={[contentContainerStyle, kbHeight ? { paddingBottom: kbHeight } : null]}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
