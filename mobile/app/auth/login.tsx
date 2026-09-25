import { useState } from 'react';
import { View, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../hooks/useAuthStore';
import {
  Input, PasswordInput, Button, toast,
  IconMail, IconLock, IconArrowRight, KeyboardAwareScrollView,
} from '../../components/ui';
import { AuthHero, HeadlineSalud } from '../../components/AuthHero';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useTheme } from '../../lib/useTheme';
import { homePath } from '../../lib/nav';
import { apiError } from '../../lib/apiError';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const router                  = useRouter();

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
      router.replace(homePath(user?.role) as never);
    } catch (err) {
      toast.error(apiError(err, 'Verificá tus credenciales'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.rail }}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <AuthHero
          image="login"
          headline={<HeadlineSalud />}
          tagline="Reservá turnos, seguí tus recetas y llevá tus estudios encima."
          right={<ThemeToggle onDark />}
        />

        {/* La hoja monta sobre el hero: el -mt-7 la solapa para que el redondeo se coma el
            borde del degradado en lugar de dejar una línea. */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-1 bg-canvas rounded-t-[28px] -mt-7 px-6 pt-7 pb-10"
        >
          <Text className="text-[26px] font-bold text-slate-900" style={{ letterSpacing: -0.52 }}>
            Bienvenido de nuevo
          </Text>
          <Text className="text-slate-500 text-sm mt-1.5 mb-6">
            Ingresá con tu cuenta para ver tus turnos
          </Text>

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

          <Button
            fullWidth
            size="lg"
            loading={isLoading}
            onPress={handleLogin}
            iconRight={<IconArrowRight size={17} color="#fff" />}
          >
            Ingresar
          </Button>

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500 text-sm">¿No tenés cuenta?  </Text>
            <Link href="/auth/register"><Text className="text-brand-700 font-bold text-sm">Registrate</Text></Link>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}
