import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Animated, SPRING } from '../../lib/motion';
import { haptic } from '../../lib/haptics';
import { cn } from '../../lib/cn';
import { shadow } from '../../lib/theme';

export interface SegTab { key: string; label: string; count?: number }

// Control segmentado estilo iOS con indicador que se desliza (spring interrumpible).
export function SegmentedTabs({
  tabs, value, onChange,
}: {
  tabs: SegTab[];
  value: string;
  onChange: (key: string) => void;
}) {
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
              style={{ width: seg }}
              className="items-center justify-center py-2.5"
            >
              <Text className={cn('text-[13px] font-semibold', active ? 'text-brand-700' : 'text-slate-500')}>
                {t.label}{t.count ? `  ${t.count}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
