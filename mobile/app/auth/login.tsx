import { useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Logo, Input, PasswordInput, Button, toast, IconMail, IconLock, KeyboardAwareScrollView } from '../../components/ui';
import { gradients, colors } from '../../lib/theme';
import { apiError } from '../../lib/apiError';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const router                  = useRouter();
  const insets                  = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return toast.error('Completá el email y la contraseña');
    }
    try {
      const result = await login(email.trim().toLowerCase(), password);
      // Si la cuenta tiene 2FA, vamos al 2do paso con el challenge
      if ('twoFactorRequired' in result) {
        router.push({ pathname: '/auth/verify-otp', params: { challenge: result.challenge } });
        return;
      }
      const { user } = useAuthStore.getState();
      router.replace(
        user?.role === 'ADMIN' ? '/admin/dashboard'
          : user?.role === 'MEDICO' ? '/medico/inicio'
            : '/patient/inicio',
      );
    } catch (err) {
      toast.error(apiError(err, 'Verificá tus credenciales'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.rail }}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <LinearGradient colors={gradients.railHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 44, paddingBottom: 40, alignItems: 'center' }}>
            <Logo size={72} />
            <Text className="text-white font-bold text-[28px] mt-4" style={{ letterSpacing: -0.5 }}>Hospital</Text>
            <Text className="text-slate-400 text-sm mt-1">Sistema de gestión hospitalaria</Text>
          </LinearGradient>

          <Animated.View entering={FadeInDown.duration(400)} className="flex-1 bg-canvas rounded-t-[32px] -mt-6 px-6 pt-7 pb-10">
            <Text className="text-[26px] font-bold text-slate-900" style={{ letterSpacing: -0.5 }}>Iniciar sesión</Text>
            <Text className="text-slate-400 text-sm mt-1 mb-6">Ingresá con tu cuenta registrada</Text>

            <Input
              label="Correo electrónico"
              iconLeft={<IconMail size={16} color={colors.slate[400]} />}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              className="mb-4"
            />
            <PasswordInput
              label="Contraseña"
              iconLeft={<IconLock size={16} color={colors.slate[400]} />}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              className="mb-2"
            />
            <Link href="/auth/forgot-password" asChild>
              <Text className="text-brand-700 font-semibold text-[13px] text-right mb-5">¿Olvidaste tu contraseña?</Text>
            </Link>

            <Button fullWidth size="lg" loading={isLoading} onPress={handleLogin}>Ingresar</Button>

            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-400 text-sm">¿No tenés cuenta?  </Text>
              <Link href="/auth/register"><Text className="text-brand-700 font-bold text-sm">Registrate</Text></Link>
            </View>

            <Link href="/server-config" asChild>
              <Text className="text-slate-400 text-[13px] text-center mt-5">Configurar servidor</Text>
            </Link>
          </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}
