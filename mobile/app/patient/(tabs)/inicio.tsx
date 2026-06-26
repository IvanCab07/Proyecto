import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { useMisTurnos, useMisRecetas, useMisEstudios } from '../../../hooks';
import {
  Card, StatCard, StatusBadge, Spinner, EmptyState,
  IconPlus, IconCalendar, IconClock, IconPill, IconFolder, IconCheckCircle,
  IconArrowRight, IconChevronRight, IconStethoscope, IconMapPin, IconUser,
} from '../../../components/ui';
import { NotificationBell } from '../../../components/NotificationBell';
import { PressableScale, enterUp, stagger } from '../../../lib/motion';
import { colors, gradients, shadow } from '../../../lib/theme';
import { formatFecha, formatFechaLarga, saludo, MESES } from '../../../lib/format';
import type { Turno } from '../../../services';

function NextTurnoCard({ t, onPress }: { t: Turno; onPress: () => void }) {
  const d = new Date(t.fecha);
  return (
    <PressableScale onPress={onPress} haptic="select" scaleTo={0.985} style={shadow.card} className="bg-surface rounded-card border border-slate-100 overflow-hidden">
      <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="px-5 py-3.5 flex-row items-center justify-between">
        <Text className="text-white text-sm font-semibold">Tu próximo turno</Text>
        <StatusBadge status={t.status} onDark />
      </LinearGradient>
      <View className="p-5 flex-row items-start gap-4">
        <View className="w-16 rounded-xl bg-brand-50 border border-brand-100 items-center py-2">
          <Text className="text-2xl font-bold text-brand-700" style={{ fontVariant: ['tabular-nums'] }}>{d.getDate()}</Text>
          <Text className="text-[11px] font-bold uppercase text-brand-600 mt-0.5">{MESES[d.getMonth()]}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-slate-900 text-base">Dr. {t.medico.nombre} {t.medico.apellido}</Text>
          <Text className="text-sm text-slate-500">{t.medico.especialidad.nombre}</Text>
          <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-3">
            <View className="flex-row items-center gap-1.5"><IconCalendar size={14} color={colors.slate[400]} /><Text className="text-[13px] text-slate-600">{formatFecha(t.fecha)}</Text></View>
            <View className="flex-row items-center gap-1.5"><IconClock size={14} color={colors.slate[400]} /><Text className="text-[13px] text-slate-600">{t.hora} hs</Text></View>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

export default function PacienteInicio() {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const turnosQ = useMisTurnos();
  const recetasQ = useMisRecetas();
  const estudiosQ = useMisEstudios();

  const turnos = turnosQ.data;
  const recetas = recetasQ.data;
  const estudios = estudiosQ.data;

  const today = new Date().toISOString().slice(0, 10);
  const proximos = (turnos ?? [])
    .filter(t => t.fecha.slice(0, 10) >= today && (t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const next = proximos[0];
  const completados = (turnos ?? []).filter(t => t.status === 'COMPLETADO').length;

  const stats = [
    { label: 'Turnos próximos', value: proximos.length, icon: <IconCalendar size={18} color="#fff" />, tone: 'brand' as const, to: '/patient/turnos' },
    { label: 'Recetas', value: recetas?.length ?? 0, icon: <IconPill size={18} color="#fff" />, tone: 'success' as const, to: '/patient/recetas' },
    { label: 'Estudios', value: estudios?.length ?? 0, icon: <IconFolder size={18} color="#fff" />, tone: 'info' as const, to: '/patient/estudios' },
    { label: 'Completados', value: completados, icon: <IconCheckCircle size={18} color="#fff" />, tone: 'warning' as const, to: '/patient/turnos' },
  ];

  const acciones = [
    { label: 'Solicitar turno', desc: 'Reservá con un médico', icon: <IconPlus size={20} color={colors.brand[600]} />, to: '/patient/solicitar' },
    { label: 'Mis turnos', desc: 'Próximos e historial', icon: <IconCalendar size={20} color={colors.brand[600]} />, to: '/patient/turnos' },
    { label: 'Recetas', desc: 'Tus indicaciones', icon: <IconPill size={20} color={colors.brand[600]} />, to: '/patient/recetas' },
    { label: 'Estudios', desc: 'Subí y consultá', icon: <IconFolder size={20} color={colors.brand[600]} />, to: '/patient/estudios' },
    { label: 'Centros y mapa', desc: 'Cómo llegar y emergencias', icon: <IconMapPin size={20} color={colors.brand[600]} />, to: '/patient/mapa' },
  ];

  const ultimasRecetas = (recetas ?? []).slice(0, 3);
  const ultimosEstudios = (estudios ?? []).slice(0, 3);

  const onRefresh = () => { turnosQ.refetch(); recetasQ.refetch(); estudiosQ.refetch(); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={turnosQ.isRefetching} onRefresh={onRefresh} tintColor={colors.brand[500]} />}
      >
        {/* Hero */}
        <LinearGradient colors={gradients.railHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 14 }}>
          <View className="px-5 pb-6 pt-1">
            <View pointerEvents="none" style={{ position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.brand[500], opacity: 0.16 }} />
            <View className="flex-row justify-end -mr-1 mb-1">
              <NotificationBell />
            </View>
            <Text className="text-brand-300 text-sm font-medium">{saludo()},</Text>
            <Text className="text-white text-[28px] font-bold mt-1" style={{ letterSpacing: -0.6 }}>{user?.nombre} {user?.apellido}</Text>
            <Text className="text-slate-300 text-[13px] mt-2 capitalize">{formatFechaLarga(new Date().toISOString())}</Text>
            <View className="mt-5 flex-row">
              <PressableScale onPress={() => router.push('/patient/solicitar')} haptic="medium" style={shadow.xs} className="flex-row items-center justify-center gap-2 bg-white rounded-field h-12 px-5">
                <IconPlus size={18} color={colors.rail} />
                <Text className="font-bold text-[15px]" style={{ color: colors.rail }}>Solicitar turno</Text>
              </PressableScale>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View className="flex-row flex-wrap justify-between px-4 pt-4">
          {stats.map((s, i) => (
            <Animated.View key={s.label} entering={stagger(i)} className="w-[48%] mb-3">
              <StatCard label={s.label} value={s.value} icon={s.icon} tone={s.tone} onPress={() => router.push(s.to as any)} />
            </Animated.View>
          ))}
        </View>

        {/* Próximo turno */}
        <Animated.View entering={enterUp(180)} className="px-4 mt-2">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-sm font-bold text-slate-900">Próximo turno</Text>
            <PressableScale onPress={() => router.push('/patient/turnos')} haptic={false} className="flex-row items-center gap-1">
              <Text className="text-[13px] font-semibold text-brand-700">Ver todos</Text>
              <IconChevronRight size={14} color={colors.brand[700]} />
            </PressableScale>
          </View>
          {turnosQ.isLoading ? (
            <Card className="p-10 items-center"><Spinner size={22} /></Card>
          ) : next ? (
            <NextTurnoCard t={next} onPress={() => router.push('/patient/turnos')} />
          ) : (
            <Card className="p-7 items-center">
              <View className="w-12 h-12 rounded-2xl bg-brand-50 items-center justify-center mb-3"><IconCalendar size={24} color={colors.brand[500]} /></View>
              <Text className="font-semibold text-slate-900">No tenés turnos próximos</Text>
              <Text className="text-sm text-slate-500 mt-1 mb-4 text-center">Reservá uno en menos de un minuto.</Text>
              <PressableScale onPress={() => router.push('/patient/solicitar')} haptic="medium" style={shadow.xs} className="flex-row items-center gap-2 bg-brand-600 rounded-field h-11 px-4">
                <IconPlus size={16} color="#fff" /><Text className="text-white font-semibold text-sm">Solicitar turno</Text>
              </PressableScale>
            </Card>
          )}
        </Animated.View>

        {/* Accesos rápidos */}
        <Animated.View entering={enterUp(220)} className="px-4 mt-5">
          <Text className="text-sm font-bold text-slate-900 mb-2.5">Accesos rápidos</Text>
          <View className="flex-row flex-wrap justify-between">
            {acciones.map((a) => (
              <View key={a.label} className="w-[48%] mb-3">
                <PressableScale
                  onPress={() => router.push(a.to as any)}
                  haptic="select"
                  style={shadow.card}
                  className="w-full bg-surface rounded-card border border-slate-100 p-4"
                >
                  <View className="w-11 h-11 rounded-xl bg-brand-50 items-center justify-center mb-3">{a.icon}</View>
                  <Text className="font-semibold text-slate-900 text-sm">{a.label}</Text>
                  <Text className="text-[12px] text-slate-500 mt-0.5">{a.desc}</Text>
                </PressableScale>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recetas / estudios recientes */}
        <Animated.View entering={enterUp(260)} className="px-4 mt-2">
          <RecentList
            title="Recetas recientes"
            onSeeAll={() => router.push('/patient/recetas')}
            empty="Todavía no tenés recetas."
            items={ultimasRecetas.map(r => ({ id: r.id, icon: <IconPill size={16} color={colors.success.text} />, chip: colors.success.soft, title: r.medicamento, sub: `${r.dosis} · ${formatFecha(r.fechaEmision)}` }))}
          />
        </Animated.View>

        <Animated.View entering={enterUp(300)} className="px-4 mt-4">
          <RecentList
            title="Estudios recientes"
            onSeeAll={() => router.push('/patient/estudios')}
            empty="Todavía no subiste estudios."
            items={ultimosEstudios.map(e => ({ id: e.id, icon: <IconFolder size={16} color={colors.info.text} />, chip: colors.info.soft, title: e.titulo, sub: formatFecha(e.fecha) }))}
          />
        </Animated.View>

        {/* CTA atención */}
        <Animated.View entering={enterUp(340)} className="px-4 mt-4">
          <Card className="p-5 bg-brand-50 border-brand-100">
            <View className="w-10 h-10 rounded-xl bg-brand-600 items-center justify-center mb-3"><IconStethoscope size={20} color="#fff" /></View>
            <Text className="text-sm font-bold text-brand-900">¿Necesitás atención?</Text>
            <Text className="text-[13px] text-brand-800/80 mt-1 mb-3">Elegí especialidad, médico y horario en pocos pasos.</Text>
            <View className="flex-row">
              <PressableScale onPress={() => router.push('/patient/solicitar')} haptic="medium" className="flex-row items-center gap-1.5 bg-brand-600 rounded-field h-9 px-3.5">
                <Text className="text-white font-semibold text-[13px]">Reservar ahora</Text><IconArrowRight size={14} color="#fff" />
              </PressableScale>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function RecentList({
  title, onSeeAll, empty, items,
}: {
  title: string; onSeeAll: () => void; empty: string;
  items: { id: string; icon: React.ReactNode; chip: string; title: string; sub: string }[];
}) {
  return (
    <Card className="p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-bold text-slate-900">{title}</Text>
        <PressableScale onPress={onSeeAll} haptic={false}><Text className="text-[13px] font-semibold text-brand-700">Ver</Text></PressableScale>
      </View>
      {items.length === 0 ? (
        <Text className="text-sm text-slate-400 py-2">{empty}</Text>
      ) : (
        <View className="gap-3">
          {items.map(it => (
            <View key={it.id} className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-lg items-center justify-center" style={{ backgroundColor: it.chip }}>{it.icon}</View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-slate-800" numberOfLines={1}>{it.title}</Text>
                <Text className="text-xs text-slate-400" numberOfLines={1}>{it.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
