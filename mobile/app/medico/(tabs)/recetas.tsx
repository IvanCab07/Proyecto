import { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRecetasMedico, useMiAgenda, useCrearReceta } from '../../../hooks';
import {
  Card, Button, Input, Textarea, Chip, Sheet, ScreenHeader, EmptyState, Skeleton, toast,
  IconPill, IconPlus,
} from '../../../components/ui';
import { PressableScale, stagger } from '../../../lib/motion';
import { colors } from '../../../lib/theme';
import { formatFechaCorta } from '../../../lib/format';
import { apiError } from '../../../lib/apiError';

const EMPTY = { pacienteId: '', medicamento: '', dosis: '', indicacion: '', validoHasta: '' };

export default function MedicoRecetas() {
  const { data: recetas, isLoading, isRefetching, refetch } = useRecetasMedico();
  const { data: agenda } = useMiAgenda();
  const crear = useCrearReceta();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  // Pacientes que el médico atendió (derivado de su agenda)
  const pacientes = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; apellido: string }>();
    for (const t of agenda ?? []) if (t.paciente) map.set(t.paciente.id, t.paciente);
    return [...map.values()].sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [agenda]);

  const handleEmitir = async () => {
    if (!form.pacienteId || !form.medicamento || !form.dosis || !form.indicacion) {
      return toast.error('Paciente, medicamento, dosis e indicación son obligatorios');
    }
    try {
      await crear.mutateAsync({
        pacienteId: form.pacienteId,
        medicamento: form.medicamento,
        dosis: form.dosis,
        indicacion: form.indicacion,
        validoHasta: form.validoHasta || undefined,
      });
      toast.success('Receta emitida');
      setModal(false); setForm(EMPTY);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo emitir la receta'));
    }
  };

  const count = recetas?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Atención" title="Recetas" subtitle={`${count} emitida${count !== 1 ? 's' : ''}`} />

      <View className="px-4 pt-4">
        <Button fullWidth iconLeft={<IconPlus size={16} color="#fff" />} disabled={pacientes.length === 0} onPress={() => { setForm(EMPTY); setModal(true); }}>
          Nueva receta
        </Button>
      </View>

      {isLoading ? (
        <View className="p-4 gap-2.5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-28 rounded-card" />)}</View>
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-12"
              icon={<IconPill size={28} color={colors.brand[500]} />}
              title="Sin recetas"
              message={pacientes.length === 0 ? 'Vas a poder emitir recetas cuando tengas pacientes en tu agenda.' : 'Emití la primera receta con "Nueva receta".'}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={stagger(index)}>
              <Card className="p-3.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                    <View className="w-10 h-10 rounded-xl bg-brand-50 items-center justify-center"><IconPill size={18} color={colors.brand[600]} /></View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1} style={{ letterSpacing: -0.3 }}>{item.medicamento}</Text>
                      <Text className="text-[12px] text-brand-700 font-semibold">{item.dosis}</Text>
                    </View>
                  </View>
                  <Text className="text-[11px] text-slate-400">{formatFechaCorta(item.fechaEmision)}</Text>
                </View>
                {item.indicacion ? <Text className="text-[12px] text-slate-600 mt-2.5">{item.indicacion}</Text> : null}
                {item.paciente ? (
                  <Text className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">
                    Paciente: {item.paciente.nombre} {item.paciente.apellido}
                  </Text>
                ) : null}
              </Card>
            </Animated.View>
          )}
        />
      )}

      <Sheet visible={modal} onClose={() => setModal(false)} title="Emitir nueva receta">
        <Text className="text-[13px] font-semibold text-slate-700 mb-2">Paciente</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {pacientes.map(p => (
            <Chip key={p.id} label={`${p.nombre} ${p.apellido}`} active={form.pacienteId === p.id} onPress={() => setForm(f => ({ ...f, pacienteId: p.id }))} />
          ))}
        </View>
        <Input label="Medicamento" value={form.medicamento} onChangeText={v => setForm(f => ({ ...f, medicamento: v }))} placeholder="Ej: Amoxicilina 500 mg" className="mb-3" />
        <Input label="Dosis" value={form.dosis} onChangeText={v => setForm(f => ({ ...f, dosis: v }))} placeholder="Ej: 1 comprimido cada 8 hs" className="mb-3" />
        <Textarea label="Indicación" value={form.indicacion} onChangeText={v => setForm(f => ({ ...f, indicacion: v }))} placeholder="Instrucciones de uso…" className="mb-3" />
        <Input label="Válido hasta" hint="Opcional · AAAA-MM-DD" value={form.validoHasta} onChangeText={v => setForm(f => ({ ...f, validoHasta: v }))} placeholder="2026-12-31" className="mb-4" />
        <Button fullWidth loading={crear.isPending} onPress={handleEmitir}>Emitir receta</Button>
      </Sheet>
    </View>
  );
}
