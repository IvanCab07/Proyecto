import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useMisCalificacionesMedico } from '../../hooks';
import {
  Card, Stars, Avatar, ScreenHeader, EmptyState, Skeleton,
  IconStar,
} from '../../components/ui';
import { stagger } from '../../lib/motion';
import { colors } from '../../lib/theme';
import { formatFechaCorta } from '../../lib/format';
import type { CalificacionDetalle } from '../../services';

export default function MedicoCalificacionesScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useMisCalificacionesMedico();
  const calificaciones = data?.calificaciones ?? [];
  const promedio = data?.promedio ?? 0;
  const cantidad = data?.cantidad ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Atención" title="Mis calificaciones" subtitle="Reseñas de tus pacientes" onBack={() => router.back()} />

      {isLoading ? (
        <View className="p-4 gap-2.5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-card" />)}</View>
      ) : (
        <FlatList
          data={calificaciones}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-12"
              icon={<IconStar size={28} color={colors.brand[500]} />}
              title="Todavía no tenés calificaciones"
              message="Cuando tus pacientes califiquen los turnos que completaste, vas a ver acá sus reseñas."
            />
          }
          ListHeaderComponent={
            cantidad > 0 ? (
              <Card className="p-4 flex-row items-center mb-1">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#FFFBEB' }}>
                  <IconStar size={24} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] text-slate-400">Tu promedio</Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Stars value={promedio} size={18} />
                    <Text className="text-base font-bold text-slate-900">{promedio.toFixed(1)}</Text>
                    <Text className="text-[12px] text-slate-400">· {cantidad} {cantidad === 1 ? 'reseña' : 'reseñas'}</Text>
                  </View>
                </View>
              </Card>
            ) : null
          }
          renderItem={({ item, index }) => <ResenaCard item={item} index={index} />}
        />
      )}
    </View>
  );
}

function ResenaCard({ item, index }: { item: CalificacionDetalle; index: number }) {
  return (
    <Animated.View entering={stagger(index)}>
      <Card className="p-3.5">
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center flex-1 mr-2">
            <Avatar nombre={item.paciente?.nombre} apellido={item.paciente?.apellido} size={34} />
            <View className="ml-2.5 flex-1">
              <Text className="text-[13px] font-bold text-slate-900" numberOfLines={1}>
                {item.paciente ? `${item.paciente.nombre} ${item.paciente.apellido}` : 'Paciente'}
              </Text>
              <Text className="text-[11px] text-slate-400">{formatFechaCorta(item.createdAt)}</Text>
            </View>
          </View>
          <Stars value={item.estrellas} size={14} />
        </View>
        {item.comentario ? <Text className="text-[13px] text-slate-600 italic mt-1">“{item.comentario}”</Text> : null}
      </Card>
    </Animated.View>
  );
}
