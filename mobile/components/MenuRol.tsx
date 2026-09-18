import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  Card, Avatar, ScreenHeader, NavRow, confirm,
  IconLogout, IconChevronRight,
} from './ui';
import { ThemePicker } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { navFor, perfilPath } from '../lib/nav';
import { PressableScale, enterUp } from '../lib/motion';
import { useTheme } from '../lib/useTheme';

const ROL_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  MEDICO: 'Médico',
  PATIENT: 'Paciente',
};

/**
 * Índice de todas las secciones del rol, agrupadas como el rail lateral de la web.
 *
 * Existe porque la barra de pestañas solo tiene lugar para cuatro destinos y el resto quedaba
 * escondido: para llegar a Usuarios, Especialidades o Calificaciones había que entrar a Ajustes
 * y bajar. Los grupos y el orden salen de lib/nav.ts, que es la misma lista que usan las
 * pestañas y los accesos rápidos de cada inicio.
 */
export function MenuRol() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const grupos = navFor(user?.role);

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Cerrar sesión', message: '¿Querés salir de tu cuenta?', confirmText: 'Salir', destructive: true });
    if (ok) { await logout(); router.replace('/auth/login'); }
  };

  const perfil = perfilPath(user?.role);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <ScreenHeader eyebrow="Menú" title="Todo a mano" right={<NotificationBell />} />

        {/* Tarjeta de identidad: atajo al perfil, que es a donde más se vuelve. */}
        <View className="px-4 pt-1">
          <Card className="p-4">
            <PressableScale
              haptic="select"
              onPress={() => router.push(perfil as never)}
              className="flex-row items-center gap-3.5"
            >
              <Avatar nombre={user?.nombre} apellido={user?.apellido} uri={user?.fotoUrl} size={52} />
              <View className="flex-1">
                <Text className="text-[17px] font-bold text-slate-900" numberOfLines={1} style={{ letterSpacing: -0.19 }}>
                  {user?.nombre} {user?.apellido}
                </Text>
                <Text className="text-slate-500 text-[13px]" numberOfLines={1}>{user?.email}</Text>
                <View className="bg-brand-50 self-start px-2.5 py-0.5 rounded-pill mt-1.5">
                  <Text className="text-brand-700 text-[10px] font-bold uppercase tracking-widest">
                    {ROL_LABEL[user?.role ?? ''] ?? 'Cuenta'}
                  </Text>
                </View>
              </View>
              <IconChevronRight size={18} color={colors.slate[300]} />
            </PressableScale>
          </Card>
        </View>

        {grupos.map((grupo, gi) => (
          <Animated.View key={grupo.label} entering={enterUp(120 + gi * 40)} className="px-4 mt-4">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
              {grupo.label}
            </Text>
            <Card className="px-4 py-1">
              {grupo.items.map((item, i) => (
                <NavRow
                  key={item.to}
                  icon={<item.icon size={16} color={colors.brand[600]} />}
                  label={item.label}
                  desc={item.desc}
                  onPress={() => router.push(item.to as never)}
                  last={i === grupo.items.length - 1}
                />
              ))}
            </Card>
          </Animated.View>
        ))}

        <Animated.View entering={enterUp(320)} className="px-4 mt-4">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
            Apariencia
          </Text>
          <Card className="p-4">
            <ThemePicker />
          </Card>
        </Animated.View>

        <View className="px-4 mt-4">
          <PressableScale
            onPress={handleLogout}
            haptic="warning"
            className="flex-row items-center justify-center gap-2 rounded-card py-4 bg-danger-soft border border-danger/20"
          >
            <IconLogout size={16} color={colors.danger.text} />
            <Text className="font-bold text-[15px]" style={{ color: colors.danger.text }}>Cerrar sesión</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}
