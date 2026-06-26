import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService } from '../../services';
import { Input, Button, toast, IconMail, IconArrowLeft, IconCheckCircle, KeyboardAwareScrollView } from '../../components/ui';
import { gradients, colors } from '../../lib/theme';
import { apiError } from '../../lib/apiError';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!email.trim()) return toast.error('Ingresá tu email');
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo procesar la solicitud'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.rail }}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <LinearGradient colors={gradients.railHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 20, paddingBottom: 40, paddingHorizontal: 24 }}>
            <Pressable onPress={() => router.back()} hitSlop={10} className="w-9 h-9 rounded-full items-center justify-center bg-white/10 mb-5">
              <IconArrowLeft size={18} color="#fff" />
            </Pressable>
            <Text className="text-white font-bold text-[26px]" style={{ letterSpacing: -0.5 }}>Recuperar acceso</Text>
            <Text className="text-slate-400 text-sm mt-1">Te enviamos un enlace seguro por email</Text>
          </LinearGradient>

          <Animated.View entering={FadeInDown.duration(400)} className="flex-1 bg-canvas rounded-t-[32px] -mt-6 px-6 pt-7 pb-10">
            {sent ? (
              <View className="items-center pt-6">
                <View className="w-16 h-16 rounded-2xl bg-success-soft items-center justify-center mb-4">
                  <IconMail size={28} color={colors.success.text} />
                </View>
                <Text className="text-[20px] font-bold text-slate-900 text-center" style={{ letterSpacing: -0.4 }}>Revisá tu correo</Text>
                <Text className="text-slate-500 text-sm text-center mt-2 leading-5">
                  Si {email} está registrado, te enviamos un enlace para restablecer tu contraseña. Vence en 1 hora.
                </Text>
                <View className="w-full mt-7">
                  <Button fullWidth variant="secondary" onPress={() => router.replace('/auth/login')}>Volver a iniciar sesión</Button>
                </View>
              </View>
            ) : (
              <>
                <Text className="text-[22px] font-bold text-slate-900" style={{ letterSpacing: -0.4 }}>¿Olvidaste tu contraseña?</Text>
                <Text className="text-slate-400 text-sm mt-1 mb-6">Ingresá tu email y te mandamos un enlace para recuperarla.</Text>

                <Input
                  label="Correo electrónico"
                  iconLeft={<IconMail size={16} color={colors.slate[400]} />}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  className="mb-6"
                />

                <Button fullWidth size="lg" loading={loading} onPress={handleSubmit}>Enviar enlace</Button>
              </>
            )}
          </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}
