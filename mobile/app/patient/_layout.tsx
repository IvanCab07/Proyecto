import { Stack } from 'expo-router';
import { useTheme } from '../../lib/useTheme';
import { useAvisosTurnos } from '../../hooks/useAvisosTurnos';

// Stack del paciente: las pestañas principales viven en (tabs) con swipe; estudios, mapa y
// perfil se apilan encima (pantalla completa, con botón "atrás") y se entra desde Menú.
export default function PatientLayout() {
  const { colors } = useTheme();
  useAvisosTurnos();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="agenda" />
      <Stack.Screen name="turnos" />
      <Stack.Screen name="recetas" />
      <Stack.Screen name="estudios" />
      <Stack.Screen name="mapa" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="obra-social" />
    </Stack>
  );
}

