import { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useObrasSociales, useCrearObraSocial } from '../../hooks';
import {
  Card, Button, Input, Sheet, ScreenHeader, EmptyState, Skeleton, toast,
  IconPlus, IconCreditCard, IconSearch,
} from '../../components/ui';
import { stagger } from '../../lib/motion';
import { useTheme } from '../../lib/useTheme';
import { apiError } from '../../lib/apiError';
import { limpiar, normalizar, validarNombreObraSocial } from '../../lib/validaciones';

/**
 * Catálogo de obras sociales que acepta la clínica. Los pacientes eligen de esta lista en
 * su perfil. El backend hoy expone listar y crear (GET/POST /obras-sociales); todavía no hay
 * endpoints para renombrar ni borrar, por eso la pantalla no los ofrece.
 */
export default function ObrasSocialesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: obras, isLoading, isRefetching, refetch } = useObrasSociales();
  const crear = useCrearObraSocial();

  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busqueda, setBusqueda] = useState('');

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return obras ?? [];
    return (obras ?? []).filter(o => normalizar(o.nombre).includes(q));
  }, [obras, busqueda]);

  const count = obras?.length ?? 0;
  const totalAfiliados = (obras ?? []).reduce((acc, o) => acc + (o._count?.pacientes ?? 0), 0);

  const openCrear = () => { setNombre(''); setError(undefined); setAbierto(true); };

  const handleGuardar = async () => {
    const err = validarNombreObraSocial(nombre);
    setError(err);
    if (err) return;
    const limpio = limpiar(nombre);
    if ((obras ?? []).some(o => normalizar(o.nombre) === normalizar(limpio))) {
      return setError('Ya existe esa obra social');
    }
    try {
      await crear.mutateAsync(limpio);
      toast.success('Obra social creada');
      setAbierto(false);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo crear la obra social'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        eyebrow="Gestión"
        title="Obras sociales"
        subtitle={`${count} cargada${count !== 1 ? 's' : ''} · ${totalAfiliados} paciente${totalAfiliados !== 1 ? 's' : ''} afiliado${totalAfiliados !== 1 ? 's' : ''}`}
        onBack={() => router.back()}
      />

      <View className="px-4 pt-4 gap-3">
        <Button fullWidth iconLeft={<IconPlus size={16} color="#fff" />} onPress={openCrear}>Nueva obra social</Button>
        {count > 5 ? (
          <Input
            placeholder="Buscar obra social…"
            value={busqueda}
            onChangeText={setBusqueda}
            iconLeft={<IconSearch size={16} color={colors.slate[400]} />}
          />
        ) : null}
      </View>

      {isLoading ? (
        <View className="p-4 gap-2.5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[76px] rounded-card" />)}</View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={o => o.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-12"
              icon={<IconCreditCard size={28} color={colors.brand[500]} />}
              title={busqueda ? 'Sin resultados' : 'Sin obras sociales'}
              message={busqueda ? 'Probá con otro nombre.' : 'Agregá la primera obra social que acepta la clínica.'}
            />
          }
          renderItem={({ item, index }) => {
            const pacientes = item._count?.pacientes ?? 0;
            return (
              <Animated.View entering={stagger(index)}>
                <Card className="flex-row items-center p-3.5">
                  <View className="w-12 h-12 rounded-xl bg-brand-50 items-center justify-center mr-3.5">
                    <IconCreditCard size={20} color={colors.brand[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: -0.3 }}>{item.nombre}</Text>
                    <View className="flex-row mt-1.5">
                      <View className={`px-2 py-0.5 rounded-pill ${pacientes > 0 ? 'bg-brand-50' : 'bg-slate-100'}`}>
                        <Text className={`text-[11px] font-bold ${pacientes > 0 ? 'text-brand-700' : 'text-slate-400'}`}>
                          {pacientes} paciente{pacientes !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            );
          }}
        />
      )}

      <Sheet visible={abierto} onClose={() => setAbierto(false)} title="Nueva obra social">
        <Input
          label="Nombre"
          placeholder="Ej: OSDE, Swiss Medical, PAMI…"
          value={nombre}
          onChangeText={(v) => { setNombre(v); if (error) setError(undefined); }}
          error={error}
          autoFocus
          className="mb-4"
        />
        <Button fullWidth loading={crear.isPending} onPress={handleGuardar}>Agregar</Button>
      </Sheet>
    </View>
  );
}
