import { useState } from 'react';
import { View, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../hooks/useAuthStore';
import {
  Input, PasswordInput, Button, toast, KeyboardAwareScrollView,
  IconUser, IconMail, IconClipboard, IconPhone, IconLock,
} from '../../components/ui';
import { AuthHero } from '../../components/AuthHero';
import { useTheme } from '../../lib/useTheme';
import { homePath } from '../../lib/nav';
import { apiError } from '../../lib/apiError';

const FORM_INIT = { nombre: '', apellido: '', email: '', dni: '', telefono: '', password: '', confirm: '' };

const FIELDS = [
  { key: 'nombre',   label: 'Nombre',   placeholder: 'Juan',           Icon: IconUser,      autoCapitalize: 'words' as const, required: true },
  { key: 'apellido', label: 'Apellido', placeholder: 'García',         Icon: IconUser,      autoCapitalize: 'words' as const, required: true },
  { key: 'email',    label: 'Email',    placeholder: 'juan@email.com', Icon: IconMail,      keyboardType: 'email-address' as const, autoCapitalize: 'none' as const, required: true },
  { key: 'dni',      label: 'DNI',      placeholder: '30123456',       Icon: IconClipboard, keyboardType: 'numeric' as const, required: true },
  { key: 'telefono', label: 'Teléfono', placeholder: '11 1234-5678',   Icon: IconPhone,     keyboardType: 'phone-pad' as const, required: false },
];

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register, isLoading } = useAuthStore();
  const router  = useRouter();
  const [form, setForm] = useState(FORM_INIT);

  const update = (key: keyof typeof FORM_INIT) => (val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.dni || !form.password) {
      return toast.error('Completá los campos marcados con *');
    }
    if (form.password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.confirm) return toast.error('Las contraseñas no coinciden');
    try {
      const { confirm, ...data } = form;
      await register(data);
      // El registro siempre crea un paciente, pero la ruta sale de homePath igual: es el único
      // lugar donde se decide a dónde va cada rol.
      router.replace(homePath('PATIENT') as never);
    } catch (err) {
      toast.error(apiError(err, 'Intentá de nuevo'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.rail }}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Hero más bajo que en el login: el formulario de registro es largo y conviene que
              se vean los primeros campos sin scrollear. */}
          <AuthHero
            image="register"
            fraccion={0.3}
            headline={<>Empezá a cuidarte{'\n'}en serio.</>}
            // Con deep link no hay pila que desandar y `back()` no haría nada.
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/login'))}
          />

          <Animated.View entering={FadeInDown.duration(400)} className="flex-1 bg-canvas rounded-t-[28px] -mt-7 px-6 pt-7 pb-10">
            <Text className="text-[24px] font-bold text-slate-900" style={{ letterSpacing: -0.48 }}>Crear cuenta</Text>
            <Text className="text-slate-500 text-sm mt-1.5 mb-6">Registrate como paciente — es gratis</Text>

            {FIELDS.map(f => (
              <Input
                key={f.key}
                label={f.label}
                required={f.required}
                iconLeft={<f.Icon size={16} color={colors.slate[400]} />}
                placeholder={f.placeholder}
                keyboardType={(f as any).keyboardType ?? 'default'}
                autoCapitalize={(f as any).autoCapitalize ?? 'sentences'}
                autoCorrect={false}
                value={form[f.key as keyof typeof FORM_INIT]}
                onChangeText={update(f.key as keyof typeof FORM_INIT)}
                className="mb-3.5"
              />
            ))}

            <PasswordInput
              label="Contraseña" required
              iconLeft={<IconLock size={16} color={colors.slate[400]} />}
              placeholder="••••••••"
              value={form.password}
              onChangeText={update('password')}
              className="mb-3.5"
            />
            <PasswordInput
              label="Confirmar contraseña" required
              iconLeft={<IconLock size={16} color={colors.slate[400]} />}
              placeholder="••••••••"
              value={form.confirm}
              onChangeText={update('confirm')}
              className="mb-6"
            />

            <Button fullWidth size="lg" loading={isLoading} onPress={handleRegister}>Crear cuenta</Button>

            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-400 text-sm">¿Ya tenés cuenta?  </Text>
              <Link href="/auth/login"><Text className="text-brand-700 font-bold text-sm">Iniciá sesión</Text></Link>
            </View>
          </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}
