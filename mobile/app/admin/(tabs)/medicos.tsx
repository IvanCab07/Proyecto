import { useState } from 'react';
import { View, Text, FlatList, Switch, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTodosMedicos, useCrearMedico, useActualizarMedico, useEliminarMedico, useEspecialidades } from '../../../hooks';
import {
  Card, Button, Input, Chip, Sheet, ScreenHeader, EmptyState, Skeleton, confirm, toast,
  IconStethoscope, IconUserPlus, IconTrash,
} from '../../../components/ui';
import { PressableScale, stagger } from '../../../lib/motion';
import { useTheme } from '../../../lib/useTheme';
import { apiError } from '../../../lib/apiError';

const FORM_INIT = { nombre: '', apellido: '', matricula: '', especialidadId: '' };

export default function MedicosAdminScreen() {
  const { colors } = useTheme();
  const { data: medicos, isLoading, isRefetching, refetch } = useTodosMedicos();
  const { data: especialidades } = useEspecialidades();
  const crearMedico = useCrearMedico();
  const actualizarMedico = useActualizarMedico();
  const eliminarMedico = useEliminarMedico();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_INIT);

  const total = medicos?.length ?? 0;
  const disponibles = medicos?.filter(m => m.disponible).length ?? 0;

  const handleToggle = (id: string, disponible: boolean) => {
    actualizarMedico.mutate({ id, disponible: !disponible }, { onError: () => toast.error('No se pudo actualizar la disponibilidad') });
  };

  const handleEliminar = async (id: string, nombre: string) => {
    const ok = await confirm({ title: 'Eliminar médico', message: `¿Seguro que querés eliminar a Dr. ${nombre}? Esta acción no se puede deshacer.`, confirmText: 'Eliminar', destructive: true });
    if (!ok) return;
    eliminarMedico.mutate(id, {
      onSuccess: () => toast.success('Médico eliminado'),
      onError: (err) => toast.error(apiError(err, 'No se pudo eliminar')),
    });
  };

  const handleCrear = async () => {
    if (!form.nombre || !form.apellido || !form.matricula || !form.especialidadId) return toast.error('Completá todos los campos');
    try {
      await crearMedico.mutateAsync(form);
      toast.success(`Dr. ${form.apellido}, ${form.nombre} agregado`);
      setShowModal(false); setForm(FORM_INIT);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo crear el médico'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Gestión" title="Médicos">
        <View className="flex-row gap-2.5">
          <Pill value={total} label="Total" color={colors.brand[300]} />
          <Pill value={disponibles} label="Disponibles" color={colors.success.DEFAULT} />
          <Pill value={total - disponibles} label="Inactivos" color={colors.warning.DEFAULT} />
        </View>
      </ScreenHeader>

      <View className="px-4 pt-4">
        <Button fullWidth iconLeft={<IconUserPlus size={16} color="#fff" />} onPress={() => setShowModal(true)}>Agregar médico</Button>
      </View>

      {isLoading ? (
        <View className="p-4 gap-2.5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-card" />)}</View>
      ) : (
        <FlatList
          data={medicos}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={<EmptyState className="pt-12" icon={<IconStethoscope size={28} color={colors.brand[500]} />} title="Sin médicos" message="Agregá el primer médico al sistema." />}
          renderItem={({ item, index }) => (
            <Animated.View entering={stagger(index)}>
              <Card className="p-3.5">
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3.5 ${item.disponible ? 'bg-brand-50' : 'bg-slate-100'}`}>
                    <IconStethoscope size={20} color={item.disponible ? colors.brand[600] : colors.slate[400]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: -0.3 }}>Dr. {item.apellido}, {item.nombre}</Text>
                    <Text className="text-[13px] text-brand-700 font-semibold mt-0.5">{item.especialidad.nombre}</Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5">Mat. {item.matricula}</Text>
                  </View>
                  <View className="items-center gap-1">
                    <Switch
                      value={item.disponible}
                      onValueChange={() => handleToggle(item.id, item.disponible)}
                      trackColor={{ false: colors.slate[200], true: colors.brand[200] }}
                      thumbColor={item.disponible ? colors.brand[600] : colors.slate[400]}
                    />
                    <Text className={`text-[10px] font-bold ${item.disponible ? 'text-brand-700' : 'text-slate-400'}`}>{item.disponible ? 'Activo' : 'Inactivo'}</Text>
                  </View>
                </View>
                <PressableScale onPress={() => handleEliminar(item.id, `${item.apellido}, ${item.nombre}`)} haptic="warning" className="mt-3 pt-3 border-t border-slate-100 flex-row items-center justify-center gap-1.5">
                  <IconTrash size={13} color={colors.danger.DEFAULT} />
                  <Text className="text-[12px] font-bold" style={{ color: colors.danger.DEFAULT }}>Eliminar médico</Text>
                </PressableScale>
              </Card>
            </Animated.View>
          )}
        />
      )}

      <Sheet visible={showModal} onClose={() => { setShowModal(false); setForm(FORM_INIT); }} title="Nuevo médico">
        <Input label="Nombre" placeholder="Ej: Carlos" value={form.nombre} onChangeText={v => setForm(f => ({ ...f, nombre: v }))} className="mb-3" />
        <Input label="Apellido" placeholder="Ej: García" value={form.apellido} onChangeText={v => setForm(f => ({ ...f, apellido: v }))} className="mb-3" />
        <Input label="Matrícula" placeholder="Ej: MN 12345" value={form.matricula} onChangeText={v => setForm(f => ({ ...f, matricula: v }))} className="mb-3" />
        <Text className="text-[13px] font-semibold text-slate-700 mb-2">Especialidad</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {especialidades?.map(e => <Chip key={e.id} label={e.nombre} active={form.especialidadId === e.id} onPress={() => setForm(f => ({ ...f, especialidadId: e.id }))} />)}
        </View>
        <Button fullWidth loading={crearMedico.isPending} onPress={handleCrear}>Guardar médico</Button>
      </Sheet>
    </View>
  );
}

function Pill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <Text className="text-white font-bold text-[22px]" style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}>{value}</Text>
      <Text className="text-[11px] font-medium mt-0.5" style={{ color }}>{label}</Text>
    </View>
  );
}
