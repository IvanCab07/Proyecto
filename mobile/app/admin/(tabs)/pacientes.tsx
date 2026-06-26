import { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { usePacientes } from '../../../hooks';
import {
  Card, Avatar, ScreenHeader, EmptyState, Skeleton,
  IconSearch, IconX, IconChevronRight, IconUsers,
} from '../../../components/ui';
import { PressableScale, stagger } from '../../../lib/motion';
import { colors, shadow } from '../../../lib/theme';

export default function PacientesScreen() {
  const { data: pacientes, isLoading, isRefetching, refetch } = usePacientes();
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filtered = useMemo(() =>
    pacientes?.filter(p => `${p.nombre} ${p.apellido} ${p.dni} ${p.email}`.toLowerCase().includes(search.toLowerCase())) ?? [],
    [pacientes, search]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Gestión" title="Pacientes" subtitle={`${pacientes?.length ?? 0} registrado${(pacientes?.length ?? 0) !== 1 ? 's' : ''}`} />

      <View className="px-4 py-3">
        <View className="flex-row items-center bg-surface rounded-field border border-slate-200 px-3.5" style={shadow.xs}>
          <IconSearch size={16} color={colors.slate[400]} />
          <TextInput
            className="flex-1 px-2.5 py-3 text-[15px] text-slate-900"
            placeholder="Buscar por nombre, apellido o DNI…"
            placeholderTextColor={colors.slate[400]}
            value={search}
            onChangeText={setSearch}
          />
          {search ? <Pressable onPress={() => setSearch('')} hitSlop={8}><IconX size={16} color={colors.slate[400]} /></Pressable> : null}
        </View>
      </View>

      {isLoading ? (
        <View className="px-4 gap-2.5">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[76px] rounded-card" />)}</View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, gap: 10, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-12"
              icon={<IconUsers size={28} color={colors.brand[500]} />}
              title={search ? 'Sin resultados' : 'Sin pacientes'}
              message={search ? `No hay resultados para “${search}”` : 'No hay pacientes registrados aún.'}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={stagger(index)}>
              <PressableScale onPress={() => router.push(`/admin/historial?pacienteId=${item.id}` as any)} haptic="select" style={shadow.card} className="bg-surface rounded-card border border-slate-100 flex-row items-center p-3.5">
                <Avatar nombre={item.nombre} apellido={item.apellido} size={46} />
                <View className="flex-1 ml-3.5">
                  <Text className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: -0.3 }}>{item.apellido}, {item.nombre}</Text>
                  <Text className="text-[12px] text-slate-500 font-semibold mt-0.5">DNI {item.dni}</Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>{item.email}</Text>
                </View>
                <View className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"><IconChevronRight size={16} color={colors.slate[400]} /></View>
              </PressableScale>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}
