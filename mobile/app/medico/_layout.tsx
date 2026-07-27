import { Stack } from 'expo-router';
import { useTheme } from '../../lib/useTheme';

// Stack del médico: las pestañas (inicio, agenda, pacientes, recetas, menú) viven en (tabs) con
// swipe; calificaciones y perfil se apilan encima y se entra desde la pestaña Menú.
export default function MedicoLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="calificaciones" />
      <Stack.Screen name="perfil" />
    </Stack>
  );
}
