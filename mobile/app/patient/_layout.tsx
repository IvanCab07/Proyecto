import { Stack } from 'expo-router';

// Stack del paciente: las pestañas principales viven en (tabs) con swipe;
// estudios y mapa se apilan encima (pantalla completa, con botón "atrás").
export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#EEF3F3' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="estudios" />
      <Stack.Screen name="mapa" />
    </Stack>
  );
}
