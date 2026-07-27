import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Animated, SPRING } from '../../lib/motion';
import { haptic } from '../../lib/haptics';
import { cn } from '../../lib/cn';
import { useTheme } from '../../lib/useTheme';

export interface SegTab { key: string; label: string; count?: number }

// Control segmentado estilo iOS con indicador que se desliza (spring interrumpible).
//
// El ancho de cada pestaña lo reparte flexbox, NO la medición: antes cada Pressable llevaba
// `style={{ width: seg }}` con `seg` derivado del ancho medido del contenedor, y eso es
// circular — si el padre se ajusta al contenido, los hijos miden 0, el contenedor mide solo su
// padding, `w` queda en 0 y las pestañas nunca crecen. Se veía solo donde el control estaba
// dentro de un `flex-row` (el de 14 días / 6 meses de Reportes); en una columna que lo estira
// el problema quedaba tapado.
//
// La medición sigue haciendo falta para el indicador, que necesita un ancho en px para poder
// animar su translateX.
export function SegmentedTabs({
  tabs, value, onChange,
}: {
  tabs: SegTab[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { shadow } = useTheme();
  const [w, setW] = useState(0);
  const seg = tabs.length ? w / tabs.length : 0;
  const idx = Math.max(0, tabs.findIndex(t => t.key === value));
  const x = useSharedValue(0);

  useEffect(() => { x.value = withSpring(idx * seg, SPRING.snappy); }, [idx, seg]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: seg }));

  return (
    <View
      className="bg-slate-100 rounded-pill p-1"
      onLayout={e => setW(e.nativeEvent.layout.width - 8)}
    >
      <View className="flex-row relative">
        {w > 0 ? (
          <Animated.View
            style={[indicator, shadow.xs, { position: 'absolute', top: 0, bottom: 0 }]}
            className="bg-surface rounded-pill"
          />
        ) : null}
        {tabs.map(t => {
          const active = t.key === value;
          return (
            <Pressable
              key={t.key}
              onPress={() => { if (!active) { haptic.select(); onChange(t.key); } }}
              className="flex-1 items-center justify-center py-2.5 px-2"
            >
              <Text
                numberOfLines={1}
                className={cn('text-[13px] font-semibold', active ? 'text-brand-700' : 'text-slate-500')}
              >
                {t.label}{t.count ? `  ${t.count}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
