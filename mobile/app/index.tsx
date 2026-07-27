import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../hooks/useAuthStore';
import { useServerStore } from '../hooks/useServerStore';
import { registerUnauthorizedHandler } from '../services/api';
import { LogoBadge, MARCA, Spinner, Button } from '../components/ui';
import { gradients } from '../lib/theme';
import { useTheme } from '../lib/useTheme';
import { homePath } from '../lib/nav';

export default function IndexScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading, loadUser, logout, user } = useAuthStore();
  const serverStatus = useServerStore((s) => s.status);
  const router = useRouter();
  const [reintentando, setReintentando] = useState(false);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
    // Primero encontrar el backend (ajusta la baseURL), después validar la sesión
    (async () => {
      await useServerStore.getState().runDiscovery();
      await loadUser();
    })();
  }, []);

  // Sin servidor NO se avanza al login: ahí el usuario solo vería "error de red" en cada
  // intento, sin ninguna pista de qué está pasando. Se queda en esta pantalla, que sí lo dice.
  useEffect(() => {
    if (isLoading || serverStatus === 'buscando' || serverStatus === 'sin-servidor') return;
    router.replace((isAuthenticated ? homePath(user?.role) : '/auth/login') as never);
  }, [isAuthenticated, isLoading, serverStatus, user]);

  const reintentar = async () => {
    setReintentando(true);
    try {
      const ok = await useServerStore.getState().runDiscovery();
      // runDiscovery deja el status en 'buscando' mientras corre y el effect de arriba se
      // vuelve a disparar solo, pero la sesión no se rehidrata sola: hay que pedirla.
      if (ok) await loadUser();
    } finally {
      setReintentando(false);
    }
  };

  const sinServidor = serverStatus === 'sin-servidor';

  return (
    <LinearGradient colors={gradients.railHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <LogoBadge size={84} />
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(150).duration(500)} className="text-rail-fg font-bold text-[32px] mt-6" style={{ letterSpacing: -0.64 }}>
        {MARCA}
      </Animated.Text>
      {/* Sobre el verde rail el texto va en rail-fg y no en la rampa slate, que se invierte
          con el tema y acá quedaría gris oscuro sobre verde. */}
      <Animated.Text entering={FadeIn.delay(250).duration(500)} className="text-rail-fg/70 text-sm mt-1">
        Turnos y gestión de salud
      </Animated.Text>

      {sinServidor ? (
        <Animated.View entering={FadeIn.duration(400)} className="absolute bottom-16 left-0 right-0 px-8 items-center">
          <Text className="text-rail-fg font-bold text-[17px] text-center">No encontramos el servidor</Text>
          <Text className="text-rail-fg/70 text-[13px] text-center mt-2 leading-5">
            Revisá que el celular esté en la misma red Wi-Fi que el servidor de la clínica.
          </Text>
          <View className="w-full mt-5">
            <Button fullWidth loading={reintentando} onPress={reintentar}>Reintentar</Button>
          </View>
          {/* Válvula de escape: si el probe da un falso negativo (Wi-Fi lento, timeout), sin
              esto la app queda trabada en esta pantalla sin ninguna salida. */}
          <Text
            accessibilityRole="button"
            onPress={() => router.replace('/auth/login')}
            className="text-rail-fg/60 text-[13px] text-center mt-4 py-2"
          >
            Continuar sin conexión
          </Text>
        </Animated.View>
      ) : (
        <View className="absolute bottom-24 items-center">
          <Spinner size={26} color={colors.railMint} />
          <Text className="text-rail-fg/60 text-xs mt-4">
            {serverStatus === 'buscando' ? 'Buscando servidor…' : 'Cargando…'}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}
