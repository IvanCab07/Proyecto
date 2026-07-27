import { View, Text, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useMisRecetas } from '../../../hooks';
import {
  Card, Avatar, ScreenHeader, EmptyState, Skeleton,
  IconPill,
} from '../../../components/ui';
import { stagger } from '../../../lib/motion';
import { useTheme } from '../../../lib/useTheme';
import { formatFecha } from '../../../lib/format';
import type { Receta } from '../../../services';

export default function RecetasScreen() {
  const { colors } = useTheme();
  const { data: recetas, isLoading, isRefetching, refetch } = useMisRecetas();
  const count = recetas?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        eyebrow="Mis recetas"
        title="Medicamentos"
        subtitle={`${count} receta${count !== 1 ? 's' : ''} emitida${count !== 1 ? 's' : ''}`}
      />
      {isLoading ? (
        <View className="p-4 gap-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-32 rounded-card" />)}
        </View>
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-16"
              icon={<IconPill size={28} color={colors.brand[500]} />}
              title="Sin recetas aún"
              message="Las recetas que emitan tus médicos aparecerán acá."
            />
          }
          renderItem={({ item, index }) => <RecetaCard item={item} index={index} />}
        />
      )}
    </View>
  );
}

function RecetaCard({ item, index }: { item: Receta; index: number }) {
  const { colors } = useTheme();
  const vencida = !!item.validoHasta && new Date(item.validoHasta) < new Date();
  return (
    <Animated.View entering={stagger(index)}>
      <Card className="overflow-hidden">
        <View className="flex-row items-center gap-3 p-4 pb-3">
          <View className="w-11 h-11 rounded-xl bg-brand-50 items-center justify-center"><IconPill size={20} color={colors.brand[600]} /></View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900" style={{ letterSpacing: -0.2 }}>{item.medicamento}</Text>
            <Text className="text-[13px] text-brand-700 font-semibold mt-0.5">{item.dosis}</Text>
          </View>
        </View>
        <View className="px-4 pb-4">
          <Text className="text-sm text-slate-600 leading-5">{item.indicacion}</Text>
          <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <View className="flex-row items-center gap-2">
              <Avatar nombre={item.medico.nombre} apellido={item.medico.apellido} size={28} />
              <View>
                <Text className="text-[12px] font-bold text-slate-900">Dr. {item.medico.apellido}</Text>
                <Text className="text-[11px] text-slate-400">{item.medico.especialidad.nombre}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[12px] text-slate-400">{formatFecha(item.fechaEmision)}</Text>
              {item.validoHasta ? (
                <View className="mt-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: vencida ? colors.danger.soft : colors.success.soft }}>
                  <Text className="text-[10px] font-bold" style={{ color: vencida ? colors.danger.text : colors.success.text }}>
                    {vencida ? 'VENCIDA' : `Vence ${formatFecha(item.validoHasta)}`}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}
