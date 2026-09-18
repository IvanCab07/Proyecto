import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cn } from '../lib/cn';
import { useTheme } from '../lib/useTheme';
import { PressableScale } from '../lib/motion';
import { TopbarButton } from './ui';
import { useThemeStore, type ThemePref } from '../hooks/useThemeStore';

// Selector de tema. Espeja el botón sol/luna del Topbar de la web, pero con tres estados en vez
// de dos: en mobile "seguir al sistema" es la opción más útil y conviene poder volver a ella.

const ICONO: Record<ThemePref, keyof typeof MaterialCommunityIcons.glyphMap> = {
  light:  'white-balance-sunny',
  dark:   'moon-waning-crescent',
  system: 'theme-light-dark',
};

const ETIQUETA: Record<ThemePref, string> = {
  light:  'Claro',
  dark:   'Oscuro',
  system: 'Automático',
};

/**
 * Botón redondo que rota claro → oscuro → sistema. `onDark` es para las pocas cabeceras que
 * siguen sobre verde (login, arranque).
 */
export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const { colors } = useTheme();
  const pref = useThemeStore((s) => s.pref);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <TopbarButton onPress={toggle} onDark={onDark}>
      <MaterialCommunityIcons
        name={ICONO[pref]}
        size={19}
        color={onDark ? colors.railFg : colors.slate[600]}
      />
    </TopbarButton>
  );
}

/** Las tres opciones en fila, para las pantallas de Menú donde hay lugar para etiquetas. */
export function ThemePicker() {
  const { colors } = useTheme();
  const pref = useThemeStore((s) => s.pref);
  const setPref = useThemeStore((s) => s.setPref);
  const opciones: ThemePref[] = ['light', 'dark', 'system'];

  return (
    <View className="flex-row gap-2">
      {opciones.map((o) => {
        const activo = o === pref;
        return (
          <PressableScale
            key={o}
            fill
            onPress={() => setPref(o)}
            haptic="select"
            className={cn(
              'items-center gap-1.5 py-3 rounded-field border',
              activo ? 'bg-brand-600 border-brand-600' : 'bg-surface border-slate-200',
            )}
          >
            <MaterialCommunityIcons
              name={ICONO[o]}
              size={18}
              color={activo ? '#fff' : colors.slate[500]}
            />
            <Text className={cn('text-[12px] font-semibold', activo ? 'text-white' : 'text-slate-600')}>
              {ETIQUETA[o]}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
