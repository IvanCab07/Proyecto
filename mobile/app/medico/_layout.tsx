import { Stack } from 'expo-router';

// Stack del médico: las pestañas (inicio, agenda, pacientes, recetas, perfil) viven en
// (tabs) con swipe; calificaciones se apila encima (pantalla completa, con botón "atrás").
export default function MedicoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#EEF3F3' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="calificaciones" />
    </Stack>
  );
}
