import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Input, Button, toast, IconShield, IconArrowLeft, KeyboardAwareScrollView } from '../../components/ui';
import { gradients, colors } from '../../lib/theme';
import { apiError } from '../../lib/apiError';

export default function VerifyOtpScreen() {
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const { completeTwoFactor, isLoading } = useAuthStore();
  const [code, setCode] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleVerify = async () => {
    if (!challenge) return router.replace('/auth/login');
    if (!/^\d{6}$/.test(code)) return toast.error('Ingresá el código de 6 dígitos');
    try {
      await completeTwoFactor(challenge, code);
      const { user } = useAuthStore.getState();
      router.replace(
        user?.role === 'ADMIN' ? '/admin/dashboard'
          : user?.role === 'MEDICO' ? '/medico/agenda'
            : '/patient/inicio',
      );
    } catch (err) {
      toast.error(apiError(err, 'El código no es válido'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.rail }}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <LinearGradient colors={gradients.railHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 20, paddingBottom: 40, paddingHorizontal: 24 }}>
            <Pressable onPress={() => router.replace('/auth/login')} hitSlop={10} className="w-9 h-9 rounded-full items-center justify-center bg-white/10 mb-5">
              <IconArrowLeft size={18} color="#fff" />
            </Pressable>
            <Text className="text-white font-bold text-[26px]" style={{ letterSpacing: -0.5 }}>Verificación en dos pasos</Text>
            <Text className="text-slate-400 text-sm mt-1">Ingresá el código de tu app autenticadora</Text>
          </LinearGradient>

          <Animated.View entering={FadeInDown.duration(400)} className="flex-1 bg-canvas rounded-t-[32px] -mt-6 px-6 pt-7 pb-10">
            <View className="w-12 h-12 rounded-2xl bg-brand-50 items-center justify-center mb-4">
              <IconShield size={24} color={colors.brand[600]} />
            </View>
            <Text className="text-[22px] font-bold text-slate-900" style={{ letterSpacing: -0.4 }}>Un paso más</Text>
            <Text className="text-slate-400 text-sm mt-1 mb-6">
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
