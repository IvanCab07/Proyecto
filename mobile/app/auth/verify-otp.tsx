import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Input, Button, toast, IconShield, KeyboardAwareScrollView } from '../../components/ui';
import { AuthHero } from '../../components/AuthHero';
import { useTheme } from '../../lib/useTheme';
import { homePath } from '../../lib/nav';
import { apiError } from '../../lib/apiError';

export default function VerifyOtpScreen() {
  const { colors } = useTheme();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const { completeTwoFactor, isLoading } = useAuthStore();
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleVerify = async () => {
    if (!challenge) return router.replace('/auth/login');
    if (!/^\d{6}$/.test(code)) return toast.error('Ingresá el código de 6 dígitos');
    try {
      await completeTwoFactor(challenge, code);
      const { user } = useAuthStore.getState();
      router.replace(homePath(user?.role) as never);
    } catch (err) {
      toast.error(apiError(err, 'El código no es válido'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.rail }}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <AuthHero
            image="login"
            fraccion={0.34}
            headline={<>Verificación{'\n'}en dos pasos.</>}
            tagline="Ingresá el código de tu app autenticadora."
            // Salir del 2do paso vuelve al login, no al paso anterior: el challenge ya no sirve.
            onBack={() => router.replace('/auth/login')}
          />

          <Animated.View entering={FadeInDown.duration(400)} className="flex-1 bg-canvas rounded-t-[28px] -mt-7 px-6 pt-7 pb-10">
            <View className="w-12 h-12 rounded-2xl bg-brand-50 items-center justify-center mb-4">
              <IconShield size={24} color={colors.brand[600]} />
            </View>
            <Text className="text-[22px] font-bold text-slate-900" style={{ letterSpacing: -0.4 }}>Un paso más</Text>
            <Text className="text-slate-500 text-sm mt-1.5 mb-6">
              Abrí Google Authenticator, Authy o similar e ingresá el código de 6 dígitos.
            </Text>

            <Input
              label="Código de verificación"
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              className="mb-6"
            />

            <Button fullWidth size="lg" loading={isLoading} onPress={handleVerify}>Verificar e ingresar</Button>
          </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}
