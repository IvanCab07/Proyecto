import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/useTheme';
import { PressableScale } from '../../lib/motion';
import { IconArrowLeft } from './Icon';

// Encabezado de pantalla: barra clara sobre el lienzo, como el Topbar de la web
// (web/src/components/Topbar.tsx).
//
// Antes era una franja con degradado verde. En la web ese verde vive en el rail lateral, que en
// mobile no existe, así que acá terminaba ocupando la cabecera de todas las pantallas. Ahora el
// verde queda como acento —botones, íconos, chips, logo— y el hero verde sobrevive solo donde
// es la marca y no el chrome: el login (components/AuthHero.tsx) y la pantalla de arranque.

export function ScreenHeader({
  title, subtitle, eyebrow, right, onBack, children,
}: {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  right?: ReactNode;
  onBack?: () => void;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-canvas px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center">
        {onBack ? (
          <PressableScale
            onPress={onBack}
            haptic="select"
            className="w-10 h-10 -ml-1 mr-2.5 rounded-full items-center justify-center bg-surface border border-slate-200"
          >
            <IconArrowLeft size={18} />
          </PressableScale>
        ) : null}
        <View className="flex-1">
          {eyebrow ? (
            <Text className="text-brand-700 text-[11px] font-bold uppercase tracking-widest">{eyebrow}</Text>
          ) : null}
          {title ? (
            <Text className="text-slate-900 text-[22px] font-bold mt-0.5" style={{ letterSpacing: -0.44 }}>
              {title}
            </Text>
          ) : null}
          {subtitle ? <Text className="text-slate-500 text-sm mt-0.5">{subtitle}</Text> : null}
        </View>
        {right ? <View className="ml-3">{right}</View> : null}
      </View>
      {children ? <View className="mt-4">{children}</View> : null}
    </View>
  );
}

/**
 * Botón redondo de la barra: el patrón de íconos del Topbar de la web (campana, tema, buscar).
 * Está acá para que la campana, el selector de tema y cualquier acción futura compartan caja.
 */
export function TopbarButton({
  onPress, children, badge, onDark = false,
}: {
  onPress?: () => void;
  children: ReactNode;
  /** Contador chico arriba a la derecha (notificaciones sin leer). */
  badge?: number;
  /** Para las pocas cabeceras que siguen sobre verde (login, arranque). */
  onDark?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="select"
      className={
        'w-10 h-10 rounded-full items-center justify-center '
        // El contorno es lo que lo hace leer como botón: al 15% sin borde, sobre el verde y
        // pegado al logo, la variante oscura se veía como parte del lockup y no como un control.
        + (onDark ? 'bg-white/20 border border-white/30' : 'bg-surface border border-slate-200')
      }
    >
      {children}
      {badge ? (
        <View
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.danger.DEFAULT,
            borderWidth: 2,
            // El borde recorta el badge contra el fondo sobre el que flota el botón.
            borderColor: onDark ? colors.rail : colors.canvas,
          }}
        >
          <Text className="text-white text-[9px] font-bold">{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
