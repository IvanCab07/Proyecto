import { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useCalificacionesAdmin } from '../../hooks';
import {
  Card, Stars, Avatar, SegmentedTabs, DistribucionEstrellas, Input, ScreenHeader, EmptyState, Skeleton,
  IconStar, IconSearch,
} from '../../components/ui';
import { PressableScale, stagger } from '../../lib/motion';
import { useTheme } from '../../lib/useTheme';
import { formatFechaCorta } from '../../lib/format';
import { normalizar } from '../../lib/validaciones';
import type { CalificacionDetalle } from '../../services';

type Orden = 'recientes' | 'antiguas' | 'mejores' | 'peores';

export default function CalificacionesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useCalificacionesAdmin();

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<number | null>(null);
  const [orden, setOrden] = useState<Orden>('recientes');

  const calificaciones = data?.calificaciones ?? [];
  const promedios = data?.promediosPorMedico ?? [];

  const total = calificaciones.length;
  const promedioGeneral = total
    ? Math.round((calificaciones.reduce((acc, c) => acc + c.estrellas, 0) / total) * 10) / 10
    : 0;

  // GET /calificaciones no manda la distribución (sí lo hace el endpoint del médico),
  // así que acá se deriva en cliente.
  const distribucion = useMemo(() => {
    const acc: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const c of calificaciones) acc[c.estrellas] = (acc[c.estrellas] ?? 0) + 1;
    return acc;
  }, [calificaciones]);

  // Los tres controles se encadenan: buscar → filtrar por puntaje → ordenar.
  const visibles = useMemo(() => {
    const q = normalizar(busqueda);
    let lista = calificaciones;

    if (q) {
      lista = lista.filter(c => {
        const campos = [
          c.paciente?.nombre, c.paciente?.apellido, c.paciente?.dni,
          c.medico?.nombre, c.medico?.apellido, c.medico?.especialidad?.nombre,
          c.comentario,
        ];
        return campos.some(v => v && normalizar(v).includes(q));
      });
    }

    if (filtro) lista = lista.filter(c => c.estrellas === filtro);

    const porFecha = (a: CalificacionDetalle, b: CalificacionDetalle) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    // slice() porque sort muta y `calificaciones` viene del caché de react-query.
    return lista.slice().sort((a, b) => {
      if (orden === 'recientes') return porFecha(a, b);
      if (orden === 'antiguas') return -porFecha(a, b);
      if (orden === 'mejores') return b.estrellas - a.estrellas || porFecha(a, b);
      return a.estrellas - b.estrellas || porFecha(a, b);
    });
  }, [calificaciones, busqueda, filtro, orden]);

  const hayFiltros = !!busqueda.trim() || filtro !== null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Gestión" title="Calificaciones" subtitle="Reseñas y promedio por médico" onBack={() => router.back()} />

      {isLoading ? (
        <View className="p-4 gap-2.5">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-card" />)}</View>
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            hayFiltros ? (
              <EmptyState
                className="pt-12"
                icon={<IconSearch size={28} color={colors.brand[500]} />}
                title="Sin resultados"
                message="Ninguna reseña coincide con lo que buscaste."
                action={
                  <PressableScale
                    onPress={() => { setBusqueda(''); setFiltro(null); }}
                    haptic="select"
                    className="rounded-pill bg-brand-50 border border-brand-100 px-4 py-2"
                  >
                    <Text className="text-[13px] font-bold text-brand-700">Limpiar filtros</Text>
                  </PressableScale>
                }
              />
            ) : (
              <EmptyState
                className="pt-12"
                icon={<IconStar size={28} color={colors.brand[500]} />}
                title="Sin calificaciones todavía"
                message="Cuando los pacientes califiquen sus turnos completados, vas a ver acá las reseñas y los promedios."
              />
            )
          }
          ListHeaderComponent={
            total > 0 ? (
              <View className="mb-1">
                {/* Promedio general */}
                <Card className="p-4 flex-row items-center mb-3">
                  <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.amber[50] }}>
                    <IconStar size={24} color={colors.amber[500]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[12px] text-slate-400">Promedio general</Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <Stars value={promedioGeneral} size={18} />
                      <Text className="text-base font-bold text-slate-900">{promedioGeneral.toFixed(1)}</Text>
                      <Text className="text-[12px] text-slate-400">· {total} {total === 1 ? 'reseña' : 'reseñas'}</Text>
                    </View>
                  </View>
                </Card>

                {/* Promedio por médico */}
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-1">Promedio por médico</Text>
                {promedios.map(p => (
                  <Card key={p.medicoId} className="p-3.5 flex-row items-center mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-[14px] font-bold text-slate-900" numberOfLines={1}>{p.nombre}</Text>
                      <Text className="text-[12px] text-slate-500">{p.especialidad}</Text>
                    </View>
                    <View className="items-end">
                      <Stars value={p.promedio} size={14} />
                      <Text className="text-[12px] text-slate-500 mt-0.5">{p.promedio.toFixed(1)} ({p.cantidad})</Text>
                    </View>
                  </Card>
                ))}

                {/* Filtros */}
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-3">Buscar y filtrar</Text>

                <Input
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Paciente, DNI, médico, especialidad…"
                  iconLeft={<IconSearch size={16} color={colors.slate[400]} />}
                  autoCorrect={false}
                  className="mb-2.5"
                />

                <Card className="p-3.5 mb-2.5">
                  <DistribucionEstrellas
                    distribucion={distribucion}
                    total={total}
                    valor={filtro}
                    onChange={setFiltro}
                  />
                </Card>

                <SegmentedTabs
                  value={orden}
                  onChange={(k) => setOrden(k as Orden)}
                  tabs={[
                    { key: 'recientes', label: 'Recientes' },
                    { key: 'antiguas', label: 'Antiguas' },
                    { key: 'mejores', label: 'Mejores' },
                    { key: 'peores', label: 'Peores' },
                  ]}
                />

                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-3">
                  {hayFiltros ? `Resultados · ${visibles.length}` : `Todas las reseñas · ${total}`}
                </Text>
              </View>
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
                {item.paciente ? `${item.paciente.nombre} ${item.paciente.apellido}` : '—'}
              </Text>
              <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                {item.medico ? `Dr. ${item.medico.apellido} · ${item.medico.especialidad.nombre}` : ''}
              </Text>
            </View>
          </View>
          <Stars value={item.estrellas} size={14} />
        </View>
        {item.comentario ? <Text className="text-[13px] text-slate-600 italic mt-1">“{item.comentario}”</Text> : null}
        <Text className="text-[11px] text-slate-400 mt-1.5">{formatFechaCorta(item.createdAt)}</Text>
      </Card>
    </Animated.View>
  );
}
