import { Stack } from 'expo-router';
import { useTheme } from '../../lib/useTheme';

// Stack del paciente: las pestañas principales viven en (tabs) con swipe; estudios, mapa y
// perfil se apilan encima (pantalla completa, con botón "atrás") y se entra desde Menú.
export default function PatientLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="estudios" />
      <Stack.Screen name="mapa" />
      <Stack.Screen name="perfil" />
    </Stack>
  );
}
