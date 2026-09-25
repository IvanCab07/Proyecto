import { useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useEspecialidades, useCrearEspecialidad, useActualizarEspecialidad, useEliminarEspecialidad } from '../../hooks';
import {
  Card, Button, Input, Sheet, ScreenHeader, EmptyState, Skeleton, confirm, toast,
  IconTag, IconPlus, IconEdit, IconTrash, IconStethoscope,
} from '../../components/ui';
import { PressableScale, stagger } from '../../lib/motion';
import { useTheme } from '../../lib/useTheme';
import { apiError } from '../../lib/apiError';

type ModalMode = 'crear' | 'editar' | null;

export default function EspecialidadesScreen() {
  const { colors } = useTheme();
  const { data: especialidades, isLoading, isRefetching, refetch } = useEspecialidades();
  const crearEsp = useCrearEspecialidad();
  const actualizarEsp = useActualizarEspecialidad();
  const eliminarEsp = useEliminarEspecialidad();
  const router = useRouter();

  const [modal, setModal] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [nombre, setNombre] = useState('');

  const openCrear = () => { setNombre(''); setModal('crear'); };
  const openEditar = (esp: { id: string; nombre: string }) => { setEditTarget(esp); setNombre(esp.nombre); setModal('editar'); };

  const handleGuardar = async () => {
    if (!nombre.trim()) return toast.error('El nombre no puede estar vacío');
    try {
      if (modal === 'crear') { await crearEsp.mutateAsync(nombre.trim()); toast.success('Especialidad creada'); }
      else if (modal === 'editar' && editTarget) { await actualizarEsp.mutateAsync({ id: editTarget.id, nombre: nombre.trim() }); toast.success('Nombre actualizado'); }
      setModal(null);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo completar la operación'));
    }
  };

  const handleEliminar = async (id: string, espNombre: string) => {
    const ok = await confirm({ title: 'Eliminar especialidad', message: `¿Eliminar "${espNombre}"? Solo es posible si no tiene médicos asignados.`, confirmText: 'Eliminar', destructive: true });
    if (!ok) return;
    try { await eliminarEsp.mutateAsync(id); toast.success('Especialidad eliminada'); }
    catch (err) { toast.error(apiError(err, 'No se pudo eliminar')); }
  };

  const isSaving = crearEsp.isPending || actualizarEsp.isPending;
  const count = especialidades?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Gestión" title="Especialidades" subtitle={`${count} configurada${count !== 1 ? 's' : ''}`} onBack={() => router.back()} />

      <View className="px-4 pt-4">
        <Button fullWidth iconLeft={<IconPlus size={16} color="#fff" />} onPress={openCrear}>Nueva especialidad</Button>
      </View>

      {isLoading ? (
        <View className="p-4 gap-2.5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[76px] rounded-card" />)}</View>
      ) : (
        <FlatList
          data={especialidades}
          keyExtractor={e => e.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={<EmptyState className="pt-12" icon={<IconTag size={28} color={colors.brand[500]} />} title="Sin especialidades" message="Agregá la primera especialidad médica." />}
          renderItem={({ item, index }) => {
            const medicosCount = (item as any)._count?.medicos ?? 0;
            return (
              <Animated.View entering={stagger(index)}>
                <Card className="flex-row items-center p-3.5">
                  <View className="w-12 h-12 rounded-xl bg-brand-50 items-center justify-center mr-3.5"><IconStethoscope size={20} color={colors.brand[600]} /></View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: -0.3 }}>{item.nombre}</Text>
                    <View className="flex-row mt-1.5">
                      <View className={`px-2 py-0.5 rounded-pill ${medicosCount > 0 ? 'bg-brand-50' : 'bg-slate-100'}`}>
                        <Text className={`text-[11px] font-bold ${medicosCount > 0 ? 'text-brand-700' : 'text-slate-400'}`}>{medicosCount} médico{medicosCount !== 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <PressableScale onPress={() => openEditar({ id: item.id, nombre: item.nombre })} haptic="select" className="w-9 h-9 rounded-lg bg-brand-50 items-center justify-center"><IconEdit size={15} color={colors.brand[600]} /></PressableScale>
                    <PressableScale onPress={() => handleEliminar(item.id, item.nombre)} haptic="warning" className="w-9 h-9 rounded-lg bg-danger-soft items-center justify-center"><IconTrash size={15} color={colors.danger.DEFAULT} /></PressableScale>
                  </View>
                </Card>
              </Animated.View>
            );
          }}
        />
      )}

      <Sheet visible={!!modal} onClose={() => setModal(null)} title={modal === 'crear' ? 'Nueva especialidad' : 'Editar especialidad'}>
        <Input label="Nombre de la especialidad" placeholder="Ej: Cardiología, Neurología…" value={nombre} onChangeText={setNombre} autoFocus className="mb-4" />
        <Button fullWidth loading={isSaving} onPress={handleGuardar}>{modal === 'crear' ? 'Agregar' : 'Guardar'}</Button>
      </Sheet>
    </View>
  );
}
