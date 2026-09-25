import { Stack } from 'expo-router';
import { useTheme } from '../../lib/useTheme';

// Stack del admin: las pestañas principales viven en (tabs) con swipe; especialidades,
// calificaciones y ajustes se apilan encima (pantalla completa, con botón "atrás") y se entra
// desde la pestaña Menú.
export default function AdminLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="especialidades" />
      <Stack.Screen name="calificaciones" />
      <Stack.Screen name="ajustes" />
    </Stack>
  );
}
