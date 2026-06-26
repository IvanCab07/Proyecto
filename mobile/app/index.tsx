import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../hooks/useAuthStore';
import { useServerStore } from '../hooks/useServerStore';
import { registerUnauthorizedHandler } from '../services/api';
import { Logo, Spinner } from '../components/ui';
import { gradients, colors } from '../lib/theme';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, loadUser, logout, user } = useAuthStore();
  const serverStatus = useServerStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    registerUnauthorizedHandler(logout);
    // Primero encontrar el backend (ajusta la baseURL), después validar la sesión
    (async () => {
      await useServerStore.getState().runDiscovery();
      await loadUser();
    })();
  }, []);

  useEffect(() => {
    if (isLoading || serverStatus === 'buscando') return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
    } else {
      router.replace(
        user?.role === 'ADMIN' ? '/admin/dashboard'
          : user?.role === 'MEDICO' ? '/medico/agenda'
            : '/patient/inicio',
      );
    }
  }, [isAuthenticated, isLoading, serverStatus, user]);

  return (
    <LinearGradient colors={gradients.railHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Logo size={84} />
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(150).duration(500)} className="text-white font-bold text-[32px] mt-6" style={{ letterSpacing: -0.5 }}>
        Hospital
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(250).duration(500)} className="text-slate-400 text-sm mt-1">
        Sistema de gestión hospitalaria
      </Animated.Text>
      <View className="absolute bottom-24 items-center">
        <Spinner size={26} color={colors.brand[400]} />
        <Text className="text-slate-500 text-xs mt-4">
          {serverStatus === 'buscando' ? 'Buscando servidor…' : 'Cargando…'}
        </Text>
      </View>
    </LinearGradient>
  );
}
