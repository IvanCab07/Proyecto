import { Stack } from 'expo-router';

// Stack del médico: las pestañas (agenda, recetas, perfil) viven en (tabs) con swipe.
export default function MedicoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#EEF3F3' } }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
