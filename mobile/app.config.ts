import type { ExpoConfig } from 'expo/config';

// La API key de Google Maps se lee de env (no se hardcodea). En Expo Go el mapa
// anda sin key; para un build de producción definí EXPO_PUBLIC_GOOGLE_MAPS_KEY.
const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

// Verde rail de la marca (--rail y --rail-soft en web/src/index.css). Es el fondo del ícono,
// del splash y de la barra de estado del arranque, en los dos temas.
const RAIL = '#2C5F4E';
const RAIL_SOFT = '#3A6B5A';

// Los archivos de assets/ los genera `npm run assets-mobile` desde web/ a partir del logo y de
// los tokens de la web. No los edites a mano.
const config: ExpoConfig = {
  name: 'Vitalis',
  slug: 'hospital-app',
  scheme: 'hospitalapp',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: 'com.escuela.hospitalapp',
    ...(mapsKey ? { config: { googleMapsApiKey: mapsKey } } : {}),
  },
  android: {
    package: 'com.escuela.hospitalapp',
    // El ícono adaptativo es la capa de frente (glifo transparente) sobre el verde rail: el
    // launcher la recorta según su forma, así que el glifo va chico y centrado.
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: RAIL,
    },
    ...(mapsKey ? { config: { googleMaps: { apiKey: mapsKey } } } : {}),
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-splash-screen', {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: RAIL,
    }],
    'expo-status-bar',
    // Aplica userInterfaceStyle: 'automatic' del lado nativo; sin este paquete prebuild avisa
    // que la opción se ignora.
    'expo-system-ui',
    // Foto de perfil. Los textos van al Info.plist de iOS y al manifest de Android, así que
    // cambiarlos requiere un build nuevo (en Expo Go de iOS pueden no aplicarse).
    ['expo-image-picker', {
      photosPermission: 'Vitalis usa tus fotos para que puedas elegir tu foto de perfil.',
      cameraPermission: 'Vitalis usa la cámara para que puedas tomarte una foto de perfil.',
    }],
    // Reemplaza los colores nativos azules de la plantilla de Expo por los de la marca.
    ['./plugins/withColoresMarca', { primary: RAIL, primaryDark: RAIL_SOFT }],
    // Android pinta el ícono chico de la barra de estado solo con el canal alfa, así que tiene que
    // ser una silueta blanca sobre transparente (assets/notification-icon.png, la cruz con el
    // pulso). Con el ícono de la app, que es un cuadrado opaco, salía un cuadrado blanco liso.
    // El logo a color va como ícono grande, a la derecha de la notificación.
    ['expo-notifications', {
      icon: './assets/notification-icon.png',
      largeIcon: './assets/icon.png',
      color: RAIL,
    }],
  ],
};

export default config;
