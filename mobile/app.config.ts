import type { ExpoConfig } from 'expo/config';

// La API key de Google Maps se lee de env (no se hardcodea). En Expo Go el mapa
// anda sin key; para un build de producción definí EXPO_PUBLIC_GOOGLE_MAPS_KEY.
const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

const config: ExpoConfig = {
  name: 'Hospital App',
  slug: 'hospital-app',
  scheme: 'hospitalapp',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: { backgroundColor: '#0B1B1A' },
  ios: {
    bundleIdentifier: 'com.escuela.hospitalapp',
    ...(mapsKey ? { config: { googleMapsApiKey: mapsKey } } : {}),
  },
  android: {
    package: 'com.escuela.hospitalapp',
    ...(mapsKey ? { config: { googleMaps: { apiKey: mapsKey } } } : {}),
  },
  plugins: ['expo-router', 'expo-secure-store'],
};

export default config;
