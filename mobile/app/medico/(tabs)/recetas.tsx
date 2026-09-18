import { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRecetasMedico, useMiAgenda, useCrearReceta, useEliminarReceta } from '../../../hooks';
import {
  Card, Button, Sheet, ScreenHeader, EmptyState, Skeleton, confirm, toast,
  IconPill, IconPlus, IconTrash,
} from '../../../components/ui';
import { RecetaForm, type PacienteRef } from '../../../components/medico/RecetaForm';
import { PressableScale, stagger } from '../../../lib/motion';
import { useTheme } from '../../../lib/useTheme';
import { formatFechaCorta } from '../../../lib/format';
import { estadoReceta } from '../../../lib/fechas';
import { apiError } from '../../../lib/apiError';
import type { CreateRecetaDTO, Receta } from '../../../services';

export default function MedicoRecetas() {
  const { colors } = useTheme();
  const { data: recetas, isLoading, isRefetching, refetch } = useRecetasMedico();
  const { data: agenda } = useMiAgenda();
  const crear = useCrearReceta();
  const eliminar = useEliminarReceta();

  const [modal, setModal] = useState(false);

  // Pacientes que el médico atendió (derivado de su agenda)
  const pacientes = useMemo<PacienteRef[]>(() => {
    const map = new Map<string, PacienteRef>();
    for (const t of agenda ?? []) if (t.paciente) map.set(t.paciente.id, t.paciente);
    return [...map.values()].sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [agenda]);

  const handleEmitir = async (data: CreateRecetaDTO) => {
    try {
      await crear.mutateAsync(data);
      toast.success('Receta emitida');
      setModal(false);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo emitir la receta'));
    }
  };

  // Todas las de esta lista salen de /recetas/medico, o sea que son propias: el botón va
  // siempre visible y el backend igual revalida.
  const handleEliminar = async (receta: Receta) => {
    const ok = await confirm({
      title: 'Eliminar receta',
      message: `Se va a eliminar la receta de ${receta.medicamento}. No se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await eliminar.mutateAsync(receta.id);
      toast.success('Receta eliminada');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo eliminar la receta'));
    }
  };

  const count = recetas?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Atención" title="Recetas" subtitle={`${count} emitida${count !== 1 ? 's' : ''}`} />

      <View className="px-4 pt-4">
        <Button fullWidth iconLeft={<IconPlus size={16} color="#fff" />} disabled={pacientes.length === 0} onPress={() => setModal(true)}>
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

                <View className="flex-row items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
                  <View className="flex-1 mr-2">
                    {item.paciente ? (
                      <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                        Paciente: {item.paciente.nombre} {item.paciente.apellido}
                      </Text>
                    ) : null}
                    <Text className="text-[11px] font-semibold mt-0.5" style={{ color: vigencia(item, colors) }}>
                      {etiquetaVigencia(item)}
                    </Text>
                  </View>
                  <PressableScale
                    onPress={() => handleEliminar(item)}
                    haptic="warning"
                    accessibilityLabel={`Eliminar receta de ${item.medicamento}`}
                    className="items-center justify-center rounded-lg px-3 py-2 bg-danger-soft border border-danger/20"
                  >
                    <IconTrash size={14} color={colors.danger.text} />
                  </PressableScale>
                </View>
              </Card>
            </Animated.View>
          )}
        />
      )}

      <Sheet visible={modal} onClose={() => setModal(false)} title="Emitir nueva receta">
        <RecetaForm pacientes={pacientes} onSubmit={handleEmitir} loading={crear.isPending} />
      </Sheet>
    </View>
  );
}

// Etiqueta y color de vigencia, con el mismo criterio que ve el paciente (lib/fechas.ts).
function etiquetaVigencia(receta: Receta): string {
  const estado = estadoReceta(receta.validoHasta);
  const hasta = formatFechaCorta(receta.validoHasta);
  if (estado === 'vencida') return `Vencida el ${hasta}`;
  if (estado === 'por-vencer') return `Vence pronto · ${hasta}`;
  return `Vigente hasta ${hasta}`;
}

function vigencia(receta: Receta, colors: ReturnType<typeof useTheme>['colors']): string {
  const estado = estadoReceta(receta.validoHasta);
  if (estado === 'vencida') return colors.danger.text;
  if (estado === 'por-vencer') return colors.warning.text;
  return colors.success.text;
}
