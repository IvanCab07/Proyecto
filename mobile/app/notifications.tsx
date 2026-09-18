import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useAuthStore } from '../hooks/useAuthStore';
import { useNotifications, useUnreadCount, useMarkNotifRead, useMarkAllNotifRead } from '../hooks';
import {
  Card, ScreenHeader, EmptyState, Skeleton, toast,
  IconBell, IconCalendar, IconClock, IconX, IconCheckCircle, IconPill, IconStar,
} from '../components/ui';
import { PressableScale, stagger } from '../lib/motion';
import type { Palette } from '../lib/theme';
import { useTheme } from '../lib/useTheme';
import type { Notification, NotificationType } from '../services';

type Tone = 'brand' | 'success' | 'warning' | 'danger';

const META: Record<NotificationType, { tone: Tone; Icon: typeof IconBell }> = {
  TURNO_SOLICITADO:      { tone: 'warning', Icon: IconClock },
  TURNO_CONFIRMADO:      { tone: 'brand',   Icon: IconCalendar },
  TURNO_CANCELADO:       { tone: 'danger',  Icon: IconX },
  TURNO_COMPLETADO:      { tone: 'success', Icon: IconCheckCircle },
  RECETA_NUEVA:          { tone: 'success', Icon: IconPill },
  SOBRETURNO_SOLICITADO: { tone: 'warning', Icon: IconClock },
  SOBRETURNO_ASIGNADO:   { tone: 'success', Icon: IconStar },
};

// Función y no constante: los colores dependen del tema, así que se resuelven en el render.
const tonos = (c: Palette): Record<Tone, { bg: string; fg: string }> => ({
  brand:   { bg: c.brand[50],     fg: c.brand[600] },
  success: { bg: c.success.soft,  fg: c.success.text },
  warning: { bg: c.warning.soft,  fg: c.warning.text },
  danger:  { bg: c.danger.soft,   fg: c.danger.text },
});

function desde(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

// Las notificaciones guardan links de la web; en mobile navegamos por tipo + rol
function routeFor(type: NotificationType, role?: string): string | null {
  if (role === 'PATIENT') return type === 'RECETA_NUEVA' ? '/patient/recetas' : '/patient/turnos';
  if (role === 'MEDICO') return '/medico/agenda';
  // El panel del admin es la lista de turnos de toda la clínica, así que sirve de destino.
  if (role === 'ADMIN') return '/admin/dashboard';
  return null;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const role = useAuthStore(s => s.user?.role);
  const { data: items, isLoading, isRefetching, refetch } = useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const markOne = useMarkNotifRead();
  const markAll = useMarkAllNotifRead();

  const onPress = (n: Notification) => {
    if (!n.leida) markOne.mutate(n.id);
    const route = routeFor(n.type, role);
    if (route) router.push(route as any);
  };

  const onMarkAll = async () => {
    try { await markAll.mutateAsync(); toast.success('Todo marcado como leído'); }
    catch { toast.error('No se pudo actualizar'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        eyebrow="Avisos"
        title="Notificaciones"
        subtitle={unread > 0 ? `${unread} sin leer` : 'Estás al día'}
        onBack={() => router.back()}
        right={unread > 0 ? (
          <PressableScale onPress={onMarkAll} haptic="select" className="px-3 py-2 rounded-full bg-white/10">
            <Text className="text-white text-[12px] font-bold">Marcar leídas</Text>
          </PressableScale>
        ) : undefined}
      />

      {isLoading ? (
        <View className="p-4 gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-card" />)}</View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => n.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-10"
              icon={<IconBell size={28} color={colors.brand[500]} />}
              title="Todo al día"
              message="No tenés novedades por ahora. Acá van a aparecer tus turnos, recetas y avisos."
            />
          }
          renderItem={({ item, index }) => {
            const meta = META[item.type];
            const tone = tonos(colors)[meta.tone];
            const Icon = meta.Icon;
            return (
              <Animated.View entering={stagger(index)}>
                <PressableScale onPress={() => onPress(item)} haptic="select">
                  <Card className={`flex-row items-start p-3.5 ${item.leida ? '' : 'border border-brand-200'}`}>
                    <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: tone.bg }}>
                      <Icon size={18} color={tone.fg} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{item.titulo}</Text>
                      <Text className="text-[13px] text-slate-500 mt-0.5" numberOfLines={2}>{item.mensaje}</Text>
                      <Text className="text-[11px] text-slate-400 mt-1">{desde(item.createdAt)}</Text>
                    </View>
                    {!item.leida && <View className="w-2 h-2 rounded-full bg-brand-600 mt-1.5" />}
                  </Card>
                </PressableScale>
              </Animated.View>
            );
          }}
        />
      )}
    </View>
  );
}
