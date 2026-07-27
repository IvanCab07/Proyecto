import { useMemo } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { useMiAgenda, useMisCalificacionesMedico } from '../../../hooks';
import {
  Card, StatCard, StatusBadge, Spinner,
  IconCalendar, IconClock, IconCheckCircle, IconStar, IconChevronRight,
} from '../../../components/ui';
import { NotificationBell } from '../../../components/NotificationBell';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { PressableScale, enterUp, stagger } from '../../../lib/motion';
import { useTheme } from '../../../lib/useTheme';
import { accesosFor } from '../../../lib/nav';
import { formatFechaLarga, saludo } from '../../../lib/format';

export default function MedicoInicio() {
  const { colors, shadow } = useTheme();
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const agendaQ = useMiAgenda();
  const { data: calif } = useMisCalificacionesMedico();

  const today = new Date().toISOString().slice(0, 10);
  const { hoy, proximos, completados } = useMemo(() => {
    const list = agendaQ.data ?? [];
    return {
      hoy: list
        .filter(t => t.fecha.slice(0, 10) === today && (t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'))
        .sort((a, b) => (a.hora < b.hora ? -1 : 1)),
      proximos: list.filter(t => t.fecha.slice(0, 10) > today && (t.status === 'PENDIENTE' || t.status === 'CONFIRMADO')).length,
      completados: list.filter(t => t.status === 'COMPLETADO').length,
    };
  }, [agendaQ.data, today]);

  const stats = [
    { label: 'Turnos hoy', value: hoy.length, icon: <IconCalendar size={18} color="#fff" />, tone: 'brand' as const, to: '/medico/agenda' },
    { label: 'Próximos', value: proximos, icon: <IconClock size={18} color="#fff" />, tone: 'info' as const, to: '/medico/agenda' },
    { label: 'Completados', value: completados, icon: <IconCheckCircle size={18} color="#fff" />, tone: 'success' as const, to: '/medico/agenda' },
    { label: 'Reseñas', value: calif?.cantidad ?? 0, icon: <IconStar size={18} color="#fff" />, tone: 'warning' as const, to: '/medico/calificaciones' },
  ];

  // Igual que en el inicio del paciente: los accesos salen de lib/nav.ts para no repetir la
  // lista de secciones en cada pantalla.
  const acciones = accesosFor('MEDICO');

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={agendaQ.isRefetching} onRefresh={agendaQ.refetch} tintColor={colors.brand[500]} />}
      >
        {/* Saludo sobre el lienzo claro (mismo criterio que el inicio del paciente). */}
        <View className="px-5 pb-1" style={{ paddingTop: insets.top + 8 }}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-slate-500 text-sm font-medium">{saludo()},</Text>
              <Text className="text-slate-900 text-[26px] font-bold mt-0.5" style={{ letterSpacing: -0.52 }}>
                Dr. {user?.nombre} {user?.apellido}
              </Text>
              <Text className="text-slate-400 text-[13px] mt-1 capitalize">{formatFechaLarga(new Date().toISOString())}</Text>
              <Text className="text-slate-500 text-[13px] mt-1">
                {hoy.length === 0 ? 'No tenés turnos para hoy.' : `Tenés ${hoy.length} ${hoy.length === 1 ? 'turno' : 'turnos'} para hoy.`}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </View>
          </View>
        </View>

        {/* Turnos de hoy — primero: es a lo que el médico entra. Los contadores quedan abajo. */}
        <Animated.View entering={enterUp(80)} className="px-4 pt-4">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-sm font-bold text-slate-900">Turnos de hoy</Text>
            <PressableScale onPress={() => router.push('/medico/agenda')} haptic={false} className="flex-row items-center gap-1">
              <Text className="text-[13px] font-semibold text-brand-700">Ver agenda</Text>
              <IconChevronRight size={14} color={colors.brand[700]} />
            </PressableScale>
          </View>
          {agendaQ.isLoading ? (
            <Card className="p-10 items-center"><Spinner size={22} /></Card>
          ) : hoy.length === 0 ? (
            <Card className="p-7 items-center">
              <View className="w-12 h-12 rounded-2xl bg-brand-50 items-center justify-center mb-3"><IconCalendar size={24} color={colors.brand[500]} /></View>
              <Text className="font-semibold text-slate-900">Sin turnos para hoy</Text>
              <Text className="text-sm text-slate-500 mt-1 text-center">Cuando tengas turnos para hoy van a aparecer acá.</Text>
            </Card>
          ) : (
            <View className="gap-2.5">
              {hoy.map(t => (
                <Card key={t.id} className="p-4 flex-row items-center">
                  <View className="w-14 items-center mr-3">
                    <Text className="text-base font-bold text-brand-700" style={{ fontVariant: ['tabular-nums'] }}>{t.hora}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-slate-900 text-[15px]" numberOfLines={1}>
                      {t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '—'}
                    </Text>
                    {t.motivo ? <Text className="text-[12px] text-slate-400 mt-0.5" numberOfLines={1}>{t.motivo}</Text> : null}
                  </View>
                  <StatusBadge status={t.status} />
                </Card>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Stats */}
        <View className="flex-row flex-wrap justify-between px-4 pt-4">
          {stats.map((s, i) => (
            <Animated.View key={s.label} entering={stagger(i, 45, 140)} className="w-[48%] mb-3">
              <StatCard label={s.label} value={s.value} icon={s.icon} tone={s.tone} onPress={() => router.push(s.to as any)} />
            </Animated.View>
          ))}
        </View>

        {/* Accesos rápidos */}
        <Animated.View entering={enterUp(240)} className="px-4 mt-2">
          <Text className="text-sm font-bold text-slate-900 mb-2.5">Accesos rápidos</Text>
          <View className="flex-row flex-wrap justify-between">
            {acciones.map(a => (
              <View key={a.label} className="w-[48%] mb-3">
                <PressableScale onPress={() => router.push(a.to as never)} haptic="select" style={shadow.card} className="w-full bg-surface rounded-card border border-slate-100 p-4">
                  <View className="w-11 h-11 rounded-xl bg-brand-50 items-center justify-center mb-3">
                    <a.icon size={20} color={colors.brand[600]} />
                  </View>
                  <Text className="font-semibold text-slate-900 text-sm">{a.label}</Text>
                  <Text className="text-[12px] text-slate-500 mt-0.5">{a.desc}</Text>
                </PressableScale>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
