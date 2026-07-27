import { useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { paletteFor, shadowFor, statusFor, gradients } from './theme';
import type { Palette, ShadowSet, StatusStyle, TurnoStatus } from './theme';

// Único punto de entrada a los colores en runtime. Todo lo que no sea un className —color de
// íconos, StatusBar, RefreshControl, react-native-maps, sombras— sale de acá.
//
// El useColorScheme() de NativeWind es lo que hace que el componente se vuelva a renderizar
// cuando cambia el tema, sea porque el usuario lo cambió en la app o en el sistema. Por eso
// importa llamar al hook y no importar `lightColors` directo: sin la suscripción, la pantalla
// se quedaría con los colores del tema con el que se montó.

export interface Theme {
  colors: Palette;
  shadow: ShadowSet;
  STATUS: Record<TurnoStatus, StatusStyle>;
  gradients: typeof gradients;
  isDark: boolean;
}

export function useTheme(): Theme {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return useMemo(() => {
    const colors = paletteFor(isDark);
    return { colors, shadow: shadowFor(isDark), STATUS: statusFor(colors), gradients, isDark };
  }, [isDark]);
}
