import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, ConfirmProvider } from '../components/ui';
import { useThemeStore } from '../hooks/useThemeStore';
import { useTheme } from '../lib/useTheme';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

export default function RootLayout() {
  const { colors, isDark } = useTheme();

  // La preferencia guardada se lee acá, lo más arriba posible, para que el tema quede aplicado
  // antes de que se monte cualquier pantalla.
  useEffect(() => { useThemeStore.getState().load(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ConfirmProvider>
              {/* Ahora que la cabecera es clara, los íconos de la barra de estado siguen al
                  tema. Las pocas pantallas que conservan el hero verde (auth, arranque)
                  declaran su propio <StatusBar style="light" />. */}
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.canvas },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/register" />
                <Stack.Screen name="patient" />
                <Stack.Screen name="medico" />
                <Stack.Screen name="admin" />
              </Stack>
            </ConfirmProvider>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
