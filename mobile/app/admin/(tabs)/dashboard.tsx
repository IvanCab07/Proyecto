import { useState, useMemo } from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAllTurnos, useUpdateTurnoStatus } from '../../../hooks';
import {
  Card, StatCard, StatusBadge, Chip, Sheet, Button, Textarea, ScreenHeader, EmptyState, Skeleton, toast,
  HoraTurno,
  IconList, IconClock, IconCalendarCheck, IconCheckCircle, IconCalendar, IconRefresh,
} from '../../../components/ui';
import { NotificationBell } from '../../../components/NotificationBell';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { PressableScale, stagger } from '../../../lib/motion';
import { type TurnoStatus } from '../../../lib/theme';
import { useTheme } from '../../../lib/useTheme';
import { formatFechaLarga } from '../../../lib/format';
import type { Turno } from '../../../services';

const FILTERS = ['TODOS', 'PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'];

const NEXT: Record<string, { label: string; status: TurnoStatus }[]> = {
  PENDIENTE:  [{ label: 'Confirmar', status: 'CONFIRMADO' }, { label: 'Cancelar', status: 'CANCELADO' }],
  CONFIRMADO: [{ label: 'Completar', status: 'COMPLETADO' }, { label: 'Cancelar', status: 'CANCELADO' }],
  COMPLETADO: [],
  CANCELADO:  [],
};

export default function AdminDashboard() {
  const { colors, STATUS } = useTheme();
  const [filter, setFilter] = useState('TODOS');
  const [modalTurno, setModalTurno] = useState<Turno | null>(null);
  const [selStatus, setSelStatus] = useState<TurnoStatus | ''>('');
  const [notas, setNotas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  const { data: todosTurnos, isLoading } = useAllTurnos();
  const updateStatus = useUpdateTurnoStatus();

  const filtered = useMemo(() => {
    if (!todosTurnos) return [];
    return filter === 'TODOS' ? todosTurnos : todosTurnos.filter(t => t.status === filter);
  }, [todosTurnos, filter]);

  const hoyStr = new Date().toDateString();
  const stats = [
    { label: 'Total', value: todosTurnos?.length ?? 0, icon: <IconList size={18} color="#fff" />, tone: 'brand' as const },
    { label: 'Pendientes', value: todosTurnos?.filter(t => t.status === 'PENDIENTE').length ?? 0, icon: <IconClock size={18} color="#fff" />, tone: 'warning' as const },
    { label: 'Hoy', value: todosTurnos?.filter(t => new Date(t.fecha).toDateString() === hoyStr).length ?? 0, icon: <IconCalendarCheck size={18} color="#fff" />, tone: 'info' as const },
    { label: 'Completados', value: todosTurnos?.filter(t => t.status === 'COMPLETADO').length ?? 0, icon: <IconCheckCircle size={18} color="#fff" />, tone: 'success' as const },
  ];

  const openModal = (t: Turno) => { setModalTurno(t); setSelStatus(''); setNotas(t.notas ?? ''); setDiagnostico(t.diagnostico ?? ''); };

  const handleConfirmar = async () => {
    if (!modalTurno || !selStatus) return;
    try {
      await updateStatus.mutateAsync({ id: modalTurno.id, status: selStatus, notas: notas.trim() || undefined, diagnostico: diagnostico.trim() || undefined });
      setModalTurno(null);
      toast.success('Estado actualizado');
    } catch {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const header = (
    <View>
      <View className="flex-row flex-wrap justify-between pt-4">
        {stats.map((s, i) => (
          <Animated.View key={s.label} entering={stagger(i)} className="w-[48%] mb-3">
            <StatCard label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
          </Animated.View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 mb-3" contentContainerStyle={{ gap: 8 }}>
        {FILTERS.map(f => <Chip key={f} label={f === 'TODOS' ? 'Todos' : STATUS[f as TurnoStatus]?.label ?? f} active={filter === f} onPress={() => setFilter(f)} tone="dark" />)}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        eyebrow={formatFechaLarga(new Date().toISOString())}
        title="Panel de control"
        right={
          <View className="flex-row items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </View>
        }
      />

      {isLoading ? (
        <View className="px-4">{header}{[0, 1, 2].map(i => <Skeleton key={i} className="h-32 rounded-card mb-3" />)}</View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState className="pt-10" icon={<IconCalendar size={28} color={colors.brand[500]} />} title="Sin turnos" message="No hay turnos con este filtro." />}
          renderItem={({ item, index }) => <AdminTurnoCard item={item} index={index} onChangeStatus={() => openModal(item)} />}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
        />
      )}

      <Sheet visible={!!modalTurno} onClose={() => setModalTurno(null)} title="Cambiar estado">
        {modalTurno ? (
          <>
            <Text className="text-[13px] text-slate-400 mb-4">
              {modalTurno.paciente?.apellido}, {modalTurno.paciente?.nombre} · {new Date(modalTurno.fecha).toLocaleDateString('es-AR')} {modalTurno.hora}
            </Text>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Nuevo estado</Text>
            <View className="flex-row gap-2.5 mb-4">
              {(NEXT[modalTurno.status] ?? []).map(opt => {
                const sel = selStatus === opt.status;
                const tone = STATUS[opt.status];
                return (
                  <PressableScale key={opt.status} fill onPress={() => setSelStatus(opt.status)} haptic="select"
                    style={{ borderWidth: 1.5, borderColor: sel ? tone.strip : colors.slate[200], backgroundColor: sel ? tone.soft : colors.surface }}
                    className="items-center py-3.5 rounded-field">
                    <Text className="font-bold text-sm" style={{ color: sel ? tone.pillText : colors.slate[600] }}>{opt.label}</Text>
                  </PressableScale>
                );
              })}
            </View>
            <Textarea label="Notas para el paciente (opcional)" placeholder="Observaciones, indicaciones previas…" value={notas} onChangeText={setNotas} className="mb-3" />
            {selStatus === 'COMPLETADO' ? (
              <Textarea label="Diagnóstico / observaciones (opcional)" placeholder="Diagnóstico, tratamiento, próximos pasos…" value={diagnostico} onChangeText={setDiagnostico} className="mb-4" />
            ) : null}
            <Button fullWidth disabled={!selStatus} loading={updateStatus.isPending} onPress={handleConfirmar}>Confirmar cambio</Button>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

function InfoBox({ tone, label, text }: { tone: { soft: string; DEFAULT: string; text: string }; label: string; text: string }) {
  return (
    <View className="mt-2 rounded-lg p-2.5" style={{ backgroundColor: tone.soft, borderLeftWidth: 3, borderLeftColor: tone.DEFAULT }}>
      <Text className="text-[11px] font-bold uppercase tracking-wide" style={{ color: tone.text }}>{label}</Text>
      <Text className="text-[12px] mt-0.5" style={{ color: tone.text }}>{text}</Text>
    </View>
  );
}

function AdminTurnoCard({ item, index, onChangeStatus }: { item: Turno; index: number; onChangeStatus: () => void }) {
  const { colors } = useTheme();
  const nextOpts = NEXT[item.status] ?? [];
  return (
    <Animated.View entering={stagger(index)}>
      <Card className="overflow-hidden flex-row">
        <HoraTurno hora={item.hora} fecha={item.fecha} />
        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: -0.3 }}>{item.paciente?.apellido}, {item.paciente?.nombre}</Text>
              <Text className="text-[12px] text-slate-400 mt-0.5">DNI {item.paciente?.dni}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          <Text className="text-[13px] text-slate-600 font-medium">Dr. {item.medico.apellido} · {item.medico.especialidad.nombre}</Text>
          {item.motivo ? <Text className="text-[12px] text-slate-400 mt-2">Motivo: {item.motivo}</Text> : null}
          {item.notas ? <InfoBox tone={colors.info} label="Nota" text={item.notas} /> : null}
          {item.diagnostico ? <InfoBox tone={{ soft: colors.brand[50], DEFAULT: colors.brand[600], text: colors.brand[800] }} label="Diagnóstico" text={item.diagnostico} /> : null}
          {nextOpts.length > 0 ? (
            <PressableScale onPress={onChangeStatus} haptic="select" className="mt-3 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5 bg-slate-50 border border-slate-200">
              <IconRefresh size={13} color={colors.slate[600]} />
              <Text className="text-[13px] font-bold text-slate-600">Cambiar estado</Text>
            </PressableScale>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}
