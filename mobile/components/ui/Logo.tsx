import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../lib/cn';
import { gradients, marca } from '../../lib/theme';
import { useTheme } from '../../lib/useTheme';

/** Nombre del producto, igual que en web/src/ui/Logo.tsx. */
export const MARCA = 'Vitalis';

/**
 * Geometría de la marca: cruz médica de trazo con una línea de latido atravesándola.
 *
 * Las paths son las mismas que exporta web/src/ui/Logo.tsx, copiadas literalmente para que el
 * símbolo sea idéntico en las dos apps. Si cambia el de la web, hay que traerlo acá y
 * regenerar los íconos con `npm run assets-mobile` desde web/.
 *
 * El trazo es grueso (2 / 1.9 sobre un viewBox de 24) a propósito: a tamaño chico un trazo
 * fino se empasta y la cruz se lee como un cuadrado.
 */
export const CRUZ_PATH =
  'M10 3H14A2.5 2.5 0 0 1 16.5 5.5V6A1.5 1.5 0 0 0 18 7.5H18.5A2.5 2.5 0 0 1 21 10V14A2.5 2.5 0 0 1 18.5 16.5H18A1.5 1.5 0 0 0 16.5 18V18.5A2.5 2.5 0 0 1 14 21H10A2.5 2.5 0 0 1 7.5 18.5V18A1.5 1.5 0 0 0 6 16.5H5.5A2.5 2.5 0 0 1 3 14V10A2.5 2.5 0 0 1 5.5 7.5H6A1.5 1.5 0 0 0 7.5 6V5.5A2.5 2.5 0 0 1 10 3Z';

export const LATIDO_PATH = 'M4.6 12.4H9.1L11.4 6.6L13.6 17.2L15.1 12.4H19.4';

export const CRUZ_ANCHO = 2;
export const LATIDO_ANCHO = 1.9;

/**
 * Solo el glifo. `color` decide el trazo, así sirve blanco sobre el rail verde y en color de
 * marca sobre fondo claro. En la web esto es `currentColor`; RN no tiene herencia de color en
 * SVG, así que hay que pasarlo.
 */
export function Logo({ size = 24, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const trazo = color ?? colors.brand[600];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={CRUZ_PATH}
        stroke={trazo}
        strokeWidth={CRUZ_ANCHO}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={LATIDO_PATH}
        stroke={trazo}
        strokeWidth={LATIDO_ANCHO}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * El glifo dentro de la pastilla menta del sistema EMS (heros de auth, pantalla de carga,
 * encabezados). El trazo va en color rail porque el fondo es menta claro en los dos temas.
 */
export function LogoBadge({ size = 44, glow = true }: { size?: number; glow?: boolean }) {
  const { shadow } = useTheme();
  const radius = Math.round(size * 0.28);
  return (
    <LinearGradient
      colors={gradients.mint}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
        glow
          ? { ...shadow.glowBrand, shadowColor: marca.mint, shadowOpacity: 0.55 }
          : null,
      ]}
    >
      <Logo size={Math.round(size * 0.62)} color={marca.rail} />
    </LinearGradient>
  );
}

/** Pastilla + nombre: la firma de la marca. */
export function LogoWordmark({
  size = 40,
  subtitulo,
  onDark = false,
  className,
}: {
  size?: number;
  subtitulo?: string;
  /** Sobre el rail verde el texto va en railFg; sobre lienzo claro, en slate-900. */
  onDark?: boolean;
  className?: string;
}) {
  const { colors } = useTheme();
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <LogoBadge size={size} />
      <View className="flex-1">
        <Text
          className="font-semibold text-[17px] leading-tight"
          style={{ color: onDark ? colors.railFg : colors.slate[900], letterSpacing: -0.19 }}
          numberOfLines={1}
        >
          {MARCA}
        </Text>
        {subtitulo ? (
          <Text
            className="text-[11px] leading-tight mt-0.5"
            style={{ color: onDark ? colors.railFg : colors.slate[500], opacity: onDark ? 0.7 : 1 }}
            numberOfLines={1}
          >
            {subtitulo}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
