import { Stack } from 'expo-router';

// Stack del admin: las pestañas principales viven en (tabs) con swipe;
// historial y especialidades se apilan encima (pantalla completa, con botón "atrás").
export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#EEF3F3' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="historial" />
      <Stack.Screen name="especialidades" />
      <Stack.Screen name="usuarios" />
      <Stack.Screen name="calificaciones" />
    </Stack>
  );
}
