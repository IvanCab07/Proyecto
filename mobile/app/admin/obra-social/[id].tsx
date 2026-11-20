import { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useCoberturas, useGuardarCobertura, useEliminarCobertura, useMedicamentos, useCrearMedicamento,
} from '../../../hooks';
import {
  Card, Button, Input, Chip, Sheet, ScreenHeader, EmptyState, Skeleton, toast, confirm,
  IconPlus, IconPill, IconEdit, IconTrash, IconSearch,
} from '../../../components/ui';
import { PressableScale, stagger } from '../../../lib/motion';
import { useTheme } from '../../../lib/useTheme';
import { apiError } from '../../../lib/apiError';
import { limpiar, normalizar, validarMedicamento } from '../../../lib/validaciones';

interface Edicion {
  /** true = cobertura nueva (hay que elegir el medicamento); false = editar el porcentaje. */
  nueva: boolean;
  medicamentoId: string | null;
  nombre: string;
  porcentaje: string;
}

/**
 * Coberturas de medicamentos de una obra social: qué porcentaje cubre de cada medicamento del
 * catálogo. El médico ve ese porcentaje al recetar y queda guardado en la receta del paciente.
 */
export default function CoberturasObraSocialScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>();

  const { data: coberturas, isLoading, isRefetching, refetch } = useCoberturas(id);
  const { data: catalogo } = useMedicamentos();
  const guardar = useGuardarCobertura(id);
  const eliminar = useEliminarCobertura(id);
  const crearMedicamento = useCrearMedicamento();

  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [errores, setErrores] = useState<{ medicamento?: string; porcentaje?: string }>({});

  // Medicamentos que todavía no tienen cobertura en esta obra social, filtrados por lo que se escribe
  const disponibles = useMemo(() => {
    const cubiertos = new Set((coberturas ?? []).map(c => c.medicamentoId));
    const q = normalizar(busqueda);
    return (catalogo ?? [])
      .filter(m => !cubiertos.has(m.id))
      .filter(m => !q || normalizar(m.nombre).includes(q));
  }, [catalogo, coberturas, busqueda]);

  const existeExacto = (catalogo ?? []).some(m => normalizar(m.nombre) === normalizar(busqueda));

  const abrirNueva = () => {
    setBusqueda('');
    setErrores({});
    setEdicion({ nueva: true, medicamentoId: null, nombre: '', porcentaje: '' });
  };

  const abrirEditar = (medicamentoId: string, nombreMed: string, porcentaje: number) => {
    setErrores({});
    setEdicion({ nueva: false, medicamentoId, nombre: nombreMed, porcentaje: String(porcentaje) });
  };

  const handleCrearMedicamento = async () => {
    const err = validarMedicamento(busqueda);
    if (err) return setErrores(e => ({ ...e, medicamento: err }));
    try {
      const m = await crearMedicamento.mutateAsync(limpiar(busqueda));
      setEdicion(e => e && { ...e, medicamentoId: m.id, nombre: m.nombre });
      setErrores(e => ({ ...e, medicamento: undefined }));
      toast.success('Medicamento agregado al catálogo');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo crear el medicamento'));
    }
  };

  const handleGuardar = async () => {
    if (!edicion) return;
    const nuevos: typeof errores = {};
    if (!edicion.medicamentoId) nuevos.medicamento = 'Elegí un medicamento';
    const pct = Number(edicion.porcentaje);
    if (!/^\d{1,3}$/.test(edicion.porcentaje.trim()) || pct < 0 || pct > 100) {
      nuevos.porcentaje = 'Tiene que ser un número entre 0 y 100';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    try {
      await guardar.mutateAsync({ medicamentoId: edicion.medicamentoId!, porcentaje: pct });
      toast.success('Cobertura guardada');
      setEdicion(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo guardar la cobertura'));
    }
  };

  const handleEliminar = async (medicamentoId: string, nombreMed: string) => {
    const ok = await confirm({
      title: 'Quitar cobertura',
      message: `${nombre ?? 'La obra social'} dejará de cubrir ${nombreMed}. Las recetas ya emitidas no cambian.`,
      confirmText: 'Quitar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await eliminar.mutateAsync(medicamentoId);
      toast.success('Cobertura quitada');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo quitar la cobertura'));
    }
  };

  const count = coberturas?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        eyebrow="Cobertura de medicamentos"
        title={nombre ?? 'Obra social'}
        subtitle={`${count} medicamento${count !== 1 ? 's' : ''} con cobertura`}
        onBack={() => router.back()}
      />

      <View className="px-4 pt-4">
        <Button fullWidth iconLeft={<IconPlus size={16} color="#fff" />} onPress={abrirNueva}>Agregar cobertura</Button>
      </View>

      {isLoading ? (
        <View className="p-4 gap-2.5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[68px] rounded-card" />)}</View>
      ) : (
        <FlatList
          data={coberturas}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-12"
              icon={<IconPill size={28} color={colors.brand[500]} />}
              title="Sin coberturas"
              message="Cargá qué porcentaje cubre esta obra social de cada medicamento."
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={stagger(index)}>
              <Card className="flex-row items-center p-3.5">
                <View className="w-11 h-11 rounded-xl bg-brand-50 items-center justify-center mr-3">
                  <IconPill size={18} color={colors.brand[600]} />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1} style={{ letterSpacing: -0.3 }}>
                    {item.medicamento.nombre}
                  </Text>
                  <Text className="text-[13px] font-semibold mt-0.5" style={{ color: colors.success.text }}>
                    Cubre {item.porcentaje}%
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <PressableScale
                    onPress={() => abrirEditar(item.medicamentoId, item.medicamento.nombre, item.porcentaje)}
                    haptic="select"
                    className="w-9 h-9 rounded-lg bg-brand-50 items-center justify-center"
                  >
                    <IconEdit size={15} color={colors.brand[600]} />
                  </PressableScale>
                  <PressableScale
                    onPress={() => handleEliminar(item.medicamentoId, item.medicamento.nombre)}
                    haptic="warning"
                    className="w-9 h-9 rounded-lg bg-danger-soft items-center justify-center"
                  >
                    <IconTrash size={15} color={colors.danger.DEFAULT} />
                  </PressableScale>
                </View>
              </Card>
            </Animated.View>
          )}
        />
      )}

      <Sheet
        visible={!!edicion}
        onClose={() => setEdicion(null)}
        title={edicion?.nueva ? 'Nueva cobertura' : edicion?.nombre ?? 'Cobertura'}
      >
        {edicion && (
          <>
            {/* Elegir medicamento solo al crear: al editar el medicamento queda fijo */}
            {edicion.nueva ? (
              <>
                <Input
                  label="Medicamento"
                  placeholder="Buscar o escribir uno nuevo…"
                  value={busqueda}
                  onChangeText={(v) => { setBusqueda(v); setErrores(e => ({ ...e, medicamento: undefined })); }}
                  iconLeft={<IconSearch size={16} color={colors.slate[400]} />}
                  error={errores.medicamento}
                  className="mb-2"
                />
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {disponibles.slice(0, 8).map(m => (
                    <Chip
                      key={m.id}
                      label={m.nombre}
                      active={edicion.medicamentoId === m.id}
                      onPress={() => {
                        setEdicion({ ...edicion, medicamentoId: m.id, nombre: m.nombre });
                        setErrores(e => ({ ...e, medicamento: undefined }));
                      }}
                    />
                  ))}
                  {busqueda.trim() && !existeExacto ? (
                    <Chip
                      label={`+ Agregar "${limpiar(busqueda)}" al catálogo`}
                      icon={<IconPlus size={13} color={colors.brand[600]} />}
                      onPress={handleCrearMedicamento}
                    />
                  ) : null}
                </View>
              </>
            ) : null}

            <Input
              label="Porcentaje que cubre"
              placeholder="Ej: 20"
              keyboardType="number-pad"
              maxLength={3}
              value={edicion.porcentaje}
              onChangeText={(v) => {
                setEdicion({ ...edicion, porcentaje: v.replace(/\D/g, '') });
                setErrores(e => ({ ...e, porcentaje: undefined }));
              }}
              error={errores.porcentaje}
              hint="De 0 a 100. El paciente lo ve en su receta."
              className="mb-4"
            />
            <Button fullWidth loading={guardar.isPending} onPress={handleGuardar}>Guardar</Button>
          </>
        )}
      </Sheet>
    </View>
  );
}
