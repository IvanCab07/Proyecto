import { useState } from 'react';
import { View, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService } from '../../services';
import { Input, Button, toast, IconMail, KeyboardAwareScrollView } from '../../components/ui';
import { AuthHero } from '../../components/AuthHero';
import { useTheme } from '../../lib/useTheme';
import { apiError } from '../../lib/apiError';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
          <AuthHero
            image="recovery"
            fraccion={0.34}
            headline={<>Recuperar{'\n'}acceso.</>}
            tagline="Te enviamos un enlace seguro por email."
            // Con deep link no hay pila que desandar y `back()` no haría nada, así que se cae al
            // login explícito, igual que verify-otp.
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/login'))}
          />

          <Animated.View entering={FadeInDown.duration(400)} className="flex-1 bg-canvas rounded-t-[28px] -mt-7 px-6 pt-7 pb-10">
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
                <Text className="text-slate-500 text-sm mt-1.5 mb-6">Ingresá tu email y te mandamos un enlace para recuperarla.</Text>

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

                {/* El botón del hero resuelve el gesto rápido; este enlace es para quien ya
                    bajó hasta el final del formulario y no quiere volver a subir. El py-3 es
                    para que se toque la fila entera y no solo el alto de la línea. */}
                <Link href="/auth/login" asChild>
                  <Text className="text-brand-700 font-semibold text-sm text-center mt-4 py-3">
                    Volver a iniciar sesión
                  </Text>
                </Link>
              </>
            )}
          </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}
