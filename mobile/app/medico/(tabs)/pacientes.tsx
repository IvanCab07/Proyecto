import { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useMiAgenda, useRecetasMedico, useCrearReceta } from '../../../hooks';
import {
  Card, Avatar, Button, Input, Textarea, Sheet, SegmentedTabs, StatusBadge,
  ScreenHeader, EmptyState, Skeleton, toast,
  IconUsers, IconPlus, IconSearch,
} from '../../../components/ui';
import { PressableScale, stagger } from '../../../lib/motion';
import { colors } from '../../../lib/theme';
import { formatFechaCorta } from '../../../lib/format';
import { apiError } from '../../../lib/apiError';

interface PacienteRef { id: string; nombre: string; apellido: string; dni: string; }
const EMPTY_RECETA = { medicamento: '', dosis: '', indicacion: '', validoHasta: '' };

export default function MedicoPacientes() {
  const { data: agenda, isLoading, isRefetching, refetch } = useMiAgenda();
  const { data: recetas } = useRecetasMedico();
  const crear = useCrearReceta();

  const [busqueda, setBusqueda] = useState('');
  const [sel, setSel] = useState<PacienteRef | null>(null);
  const [tab, setTab] = useState('turnos');
  const [recetaModal, setRecetaModal] = useState(false);
  const [form, setForm] = useState(EMPTY_RECETA);

  const pacientes = useMemo<PacienteRef[]>(() => {
    const map = new Map<string, PacienteRef>();
    for (const t of agenda ?? []) if (t.paciente && !map.has(t.paciente.id)) map.set(t.paciente.id, t.paciente);
    return [...map.values()].sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [agenda]);

  const filtrados = pacientes.filter(p => `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(busqueda.toLowerCase()));
  const turnosPaciente = (agenda ?? []).filter(t => t.paciente?.id === sel?.id);
  const recetasPaciente = (recetas ?? []).filter(r => r.paciente?.id === sel?.id);

  const handleEmitir = async () => {
    if (!sel) return;
    if (!form.medicamento || !form.dosis || !form.indicacion) return toast.error('Medicamento, dosis e indicación son obligatorios');
    try {
      await crear.mutateAsync({
        pacienteId: sel.id,
        medicamento: form.medicamento,
        dosis: form.dosis,
        indicacion: form.indicacion,
        validoHasta: form.validoHasta ? new Date(form.validoHasta).toISOString() : undefined,
      });
      toast.success('Receta emitida');
      setRecetaModal(false); setForm(EMPTY_RECETA);
    } catch (e) { toast.error(apiError(e, 'No se pudo emitir la receta')); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        eyebrow="Atención"
        title="Mis pacientes"
        subtitle={pacientes.length === 1 ? '1 paciente atendido' : `${pacientes.length} pacientes atendidos`}
      />

      <View className="px-4 pt-4 pb-2">
        <Input
          iconLeft={<IconSearch size={18} color={colors.slate[400]} />}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre o DNI…"
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <View className="px-4 gap-2.5">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-card" />)}</View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 8, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-12"
              icon={<IconUsers size={28} color={colors.brand[500]} />}
              title={busqueda ? 'Sin resultados' : 'Todavía no atendiste pacientes'}
              message={busqueda ? `Ningún paciente coincide con "${busqueda}".` : 'Cuando tengas turnos asignados, tus pacientes van a aparecer acá.'}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={stagger(index)}>
              <PressableScale haptic="select" onPress={() => { setSel(item); setTab('turnos'); }}>
                <Card className="p-3.5 flex-row items-center">
                  <Avatar nombre={item.nombre} apellido={item.apellido} size={40} />
                  <View className="flex-1 ml-3">
                    <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1}>{item.nombre} {item.apellido}</Text>
                    <Text className="text-[12px] text-slate-400">DNI {item.dni}</Text>
                  </View>
                </Card>
              </PressableScale>
            </Animated.View>
          )}
        />
      )}

      {/* Historial del paciente */}
      <Sheet visible={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.nombre} ${sel.apellido}` : ''}>
        {sel ? (
          <>
            <SegmentedTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { key: 'turnos', label: 'Turnos', count: turnosPaciente.length },
                { key: 'recetas', label: 'Recetas', count: recetasPaciente.length },
              ]}
            />
            <View className="mt-4" style={{ maxHeight: 340 }}>
              {tab === 'turnos' ? (
                turnosPaciente.length === 0 ? (
                  <Text className="text-sm text-slate-400 py-8 text-center">Sin turnos registrados.</Text>
                ) : (
                  <FlatList
                    data={turnosPaciente}
                    keyExtractor={t => t.id}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View className="h-2" />}
                    renderItem={({ item: t }) => (
                      <View className="rounded-field border border-slate-100 p-3">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[13px] font-bold text-slate-900">{formatFechaCorta(t.fecha)} · {t.hora}</Text>
                          <StatusBadge status={t.status} />
                        </View>
                        {t.motivo ? <Text className="text-[12px] text-slate-400 italic mt-1">“{t.motivo}”</Text> : null}
                        {t.diagnostico ? (
                          <Text className="text-[12px] mt-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: colors.success.soft, color: colors.success.text }}>{t.diagnostico}</Text>
                        ) : null}
                      </View>
                    )}
                  />
                )
              ) : (
                <>
                  <Button fullWidth size="sm" iconLeft={<IconPlus size={15} color="#fff" />} onPress={() => { setForm(EMPTY_RECETA); setRecetaModal(true); }} className="mb-3">Nueva receta</Button>
                  {recetasPaciente.length === 0 ? (
                    <Text className="text-sm text-slate-400 py-6 text-center">Sin recetas emitidas.</Text>
                  ) : (
                    <FlatList
                      data={recetasPaciente}
                      keyExtractor={r => r.id}
                      showsVerticalScrollIndicator={false}
                      ItemSeparatorComponent={() => <View className="h-2" />}
                      renderItem={({ item: r }) => (
                        <View className="rounded-field border border-slate-100 p-3">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-[14px] font-bold text-slate-900">{r.medicamento}</Text>
                            <Text className="text-[11px] text-slate-400">{formatFechaCorta(r.fechaEmision)}</Text>
                          </View>
                          <Text className="text-[12px] text-brand-700 font-semibold">{r.dosis}</Text>
                          {r.indicacion ? <Text className="text-[12px] text-slate-600 mt-1">{r.indicacion}</Text> : null}
                        </View>
                      )}
                    />
                  )}
                </>
              )}
            </View>
          </>
        ) : null}
      </Sheet>

      {/* Emitir receta */}
      <Sheet visible={recetaModal} onClose={() => setRecetaModal(false)} title="Emitir nueva receta">
        {sel ? <Text className="text-[13px] text-slate-400 mb-3">Para {sel.nombre} {sel.apellido}</Text> : null}
        <Input label="Medicamento" value={form.medicamento} onChangeText={v => setForm(f => ({ ...f, medicamento: v }))} placeholder="Ej: Amoxicilina 500 mg" className="mb-3" />
        <Input label="Dosis" value={form.dosis} onChangeText={v => setForm(f => ({ ...f, dosis: v }))} placeholder="Ej: 1 comprimido cada 8 hs" className="mb-3" />
        <Textarea label="Indicación" value={form.indicacion} onChangeText={v => setForm(f => ({ ...f, indicacion: v }))} placeholder="Instrucciones de uso…" className="mb-3" />
        <Input label="Válido hasta" hint="Opcional · AAAA-MM-DD" value={form.validoHasta} onChangeText={v => setForm(f => ({ ...f, validoHasta: v }))} placeholder="2026-12-31" className="mb-4" />
        <Button fullWidth loading={crear.isPending} onPress={handleEmitir}>Emitir receta</Button>
      </Sheet>
    </View>
  );
}
