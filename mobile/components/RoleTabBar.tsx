import type { ComponentType } from 'react';
import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { PressableScale } from '../lib/motion';
import { cn } from '../lib/cn';
import { useTheme } from '../lib/useTheme';
import type { IconProps } from './ui/Icon';
import { IconPlus } from './ui';

// Barra de pestañas flotante, compartida por los tres roles. Antes cada (tabs)/_layout.tsx
// tenía su propia copia casi idéntica.
//
// La última pestaña de cada rol es siempre «Menú»: desde ahí se llega a TODAS las secciones del
// rol, así que ninguna queda enterrada aunque no entre en la barra.

export interface TabDef {
  /** Nombre de la ruta dentro del grupo (tiene que coincidir con el archivo). */
  name: string;
  Icon: ComponentType<IconProps>;
  label: string;
  /** Botón central elevado (el "solicitar turno" del paciente). */
  isFab?: boolean;
}

/**
 * Alto de la barra sin contar el safe area de abajo (paddingTop 8 + py-2 x2 + contenido).
 *
 * Lo exporta para que lo que flote encima —el FAB del asistente— se posicione en
 * `insets.bottom + ALTO_TABBAR + margen` en vez de con un `bottom-28` a ojo, que se solapaba
 * con la barra en los teléfonos con gesture bar.
 */
export const ALTO_TABBAR = 76;

export function RoleTabBar({ state, navigation, tabs }: MaterialTopTabBarProps & { tabs: TabDef[] }) {
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 6), paddingTop: 8, paddingHorizontal: 16 }}>
      <View className="flex-row items-center bg-surface rounded-[26px] px-2 py-2" style={shadow.pop}>
        {tabs.map((tab) => {
          const focused = focusedName === tab.name;
          const go = () => { if (focusedName !== tab.name) navigation.navigate(tab.name as never); };

          if (tab.isFab) {
            return (
              <View key={tab.name} className="flex-1 items-center" style={{ marginTop: -28 }}>
                <PressableScale haptic="medium" onPress={go} accessibilityLabel={tab.label}>
                  <LinearGradient
                    colors={[colors.brand[400], colors.brand[600]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      {
                        width: 56, height: 56, borderRadius: 20, alignItems: 'center',
                        justifyContent: 'center', borderWidth: 4, borderColor: colors.surface,
                      },
                      shadow.glowBrand,
                    ]}
                  >
                    <IconPlus size={24} color="#fff" />
                  </LinearGradient>
                </PressableScale>
              </View>
            );
          }

          return (
            <View key={tab.name} className="flex-1">
              <PressableScale haptic="select" onPress={go} scaleTo={0.9} className="items-center py-1.5">
                <tab.Icon size={20} color={focused ? colors.brand[600] : colors.slate[400]} />
                <Text className={cn('text-[10px] font-bold mt-1', focused ? 'text-brand-700' : 'text-slate-400')}>
                  {tab.label}
                </Text>
              </PressableScale>
            </View>
          );
        })}
      </View>
    </View>
  );
}
