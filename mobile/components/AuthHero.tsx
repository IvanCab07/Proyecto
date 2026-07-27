import type { ReactNode } from 'react';
import { View, Text, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LogoWordmark, TopbarButton, IconArrowLeft } from './ui';
import { gradients, marca } from '../lib/theme';

// Panel superior de las pantallas de ingreso. Es la adaptación del panel derecho de la web
// (web/src/pages/auth/AuthLayout.tsx): allá es media pantalla al costado del formulario, acá va
// arriba y el formulario queda en una hoja debajo, que es lo que funciona en un teléfono. Ojo
// que la web esconde este panel en pantallas chicas, así que no hay un layout de referencia:
// esto es el equivalente mobile, no una copia.
//
// LAS ILUSTRACIONES: láminas botánicas de hierbas medicinales, en assets/. Tienen fondo
// transparente a propósito — las plantas quedan recortadas flotando sobre el degradado verde y
// los halos menta, así que el verde sigue siendo el lienzo. Las genera
// `npm run assets-mobile` desde web/ a partir de web/assets-fuente/.
const IMAGENES = {
  login:    require('../assets/auth-login.png'),
  register: require('../assets/auth-register.png'),
  recovery: require('../assets/auth-recovery.png'),
};

export type ImagenAuth = keyof typeof IMAGENES;

/**
 * Cuánto sube la hoja del formulario por encima del hero (el `-mt-7` de cada pantalla).
 *
 * Está acá porque el hero tiene que reservar ese espacio abajo: la hoja es hermana posterior, o
 * sea que se dibuja ENCIMA, y si el padding inferior es igual al solape le come los descendentes
 * al titular. Ese era el "corte" que se veía. El padding real es este valor más el aire que
 * queremos ver entre el texto y el borde de la hoja.
 */
export const SOLAPE_HOJA = 28;
const AIRE_TITULAR = 28;

// Geometría del fondo, toda medida HACIA ARRIBA desde el borde inferior del hero y en fracciones
// de `alto`.
//
// La lámina y el velo van las dos ancladas abajo a propósito: el hero crece por encima de `alto`
// cuando el titular no entra (ver el minHeight de más abajo), y si la lámina se anclara arriba
// se separaría del velo al crecer. Eso es justo lo que deja asomar su borde recto donde apoya la
// hoja del formulario.
const LAMINA_BASE = 0.24; // dónde termina la lámina
const LAMINA_ALTO = 0.80;
const VELO_ALTO   = 0.90;
/** Cuánto antes que el borde de la lámina el velo ya es verde opaco. Es el margen de seguridad. */
const MARGEN      = 0.10;

// El stop opaco del velo, pasado a su propia escala (0 = arriba del velo, 1 = abajo). Se calcula
// en vez de dejarse a mano para que la cuenta no haya que rehacerla si se toca la lámina.
const STOP_OPACO = 1 - (LAMINA_BASE + MARGEN) / VELO_ALTO;

interface AuthHeroProps {
  /** Qué lámina va de fondo. Cada tramo del flujo usa la suya, igual que en la web. */
  image?: ImagenAuth;
  /** Titular grande. Se le pasa JSX para poder resaltar una palabra en menta. */
  headline: ReactNode;
  tagline?: string;
  /** Fracción del alto de pantalla que ocupa el hero. */
  fraccion?: number;
  /** Vuelta atrás: botón circular arriba a la izquierda, donde se lo busca. */
  onBack?: () => void;
  /** Control alineado arriba a la derecha (hoy solo el selector de tema del login). */
  right?: ReactNode;
}

export function AuthHero({
  image = 'login', headline, tagline, fraccion = 0.42, onBack, right,
}: AuthHeroProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Mínimo de 280 px: en pantallas bajas (o con el teclado abierto reduciendo el alto útil) una
  // fracción sola dejaría el hero como una franja y la lámina no se leería.
  const alto = Math.max(280, height * fraccion);

  return (
    // minHeight y NO height: `alto` es un piso, no una jaula. Con altura fija, en un teléfono
    // corto (donde el Math.max de arriba se activa) el titular más el tagline no entran, el
    // `flex-1 justify-end` comprime el bloque y la última línea queda cortada por la hoja. Así el
    // hero se estira lo que haga falta. El overflow hidden recorta los halos, que sangran fuera.
    <LinearGradient
      colors={gradients.railCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ minHeight: alto, paddingTop: insets.top + 12, overflow: 'hidden' }}
    >
      {/* Halos: RN no tiene radial-gradient, así que son círculos con opacidad baja. Le dan
          profundidad al degradado y se ven incluso si falta la lámina. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', top: -140, right: -100, width: 340, height: 340,
          borderRadius: 170, backgroundColor: marca.mint, opacity: 0.22,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', bottom: -160, left: -90, width: 300, height: 300,
          borderRadius: 150, backgroundColor: marca.verde, opacity: 0.18,
        }}
      />

      {/* La lámina. `contain` para que entre entera: es un recorte, y con `cover` se perderían
          plantas por los costados. Termina en LAMINA_BASE para despejar la base, que es donde va
          el titular — es la perilla de ajuste fino, igual que el `center 42%` de la web. */}
      <Image
        source={IMAGENES[image]}
        resizeMode="contain"
        style={{
          position: 'absolute', left: 0, right: 0,
          bottom: alto * LAMINA_BASE, height: alto * LAMINA_ALTO,
        }}
      />

      {/* Velo: hace que el titular se lea sobre la lámina, sea clara u oscura, y también sobre
          el degradado pelado cuando no hay ninguna. Llega a verde opaco MARGEN por encima de
          donde termina la lámina, así su borde recto queda tapado — si el verde se volviera
          opaco más abajo, el corte asomaría justo donde apoya la hoja del formulario. */}
      <LinearGradient
        colors={['transparent', 'rgba(44,95,78,0.55)', marca.rail]}
        locations={[0, STOP_OPACO * 0.6, STOP_OPACO]}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: alto * VELO_ALTO }}
      />

      <View className="flex-1 px-6" style={{ paddingBottom: SOLAPE_HOJA + AIRE_TITULAR }}>
        <View className="flex-row items-center">
          {onBack ? (
            <View className="mr-2.5">
              <TopbarButton onPress={onBack} onDark>
                <IconArrowLeft size={18} color={marca.railFg} />
              </TopbarButton>
            </View>
          ) : null}
          <View className="flex-1">
            <LogoWordmark size={38} onDark />
          </View>
          {right ? <View className="ml-3">{right}</View> : null}
        </View>

        {/* El titular va anclado abajo, como en la web. El interlineado es 1,33× el cuerpo: más
            ajustado que eso y Android recorta descendentes y comas — y este titular termina
            justo en "La salud,". */}
        <View className="flex-1 justify-end">
          <Animated.Text
            entering={FadeInDown.delay(100).duration(450)}
            className="text-rail-fg text-[30px] font-bold"
            style={{ letterSpacing: -0.6, lineHeight: 40 }}
          >
            {headline}
          </Animated.Text>
          {tagline ? (
            <Animated.Text
              entering={FadeInDown.delay(180).duration(450)}
              className="text-rail-fg/75 text-[14px] mt-2.5"
              style={{ lineHeight: 21 }}
            >
              {tagline}
            </Animated.Text>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

/** El titular del login, con la palabra resaltada en menta como en la web. */
export function HeadlineSalud() {
  return (
    <>
      La salud,{'\n'}<Text className="text-rail-mint">bien</Text> atendida.
    </>
  );
}
