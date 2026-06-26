import { useState, useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import Animated from 'react-native-reanimated';
import { useMiAgenda, useUpdateTurnoStatus } from '../../../hooks';
import {
  Card, StatusBadge, Sheet, Button, Textarea, ScreenHeader, SegmentedTabs, EmptyState, Skeleton, toast,
  IconCalendar, IconClock, IconCalendarCheck, IconRefresh,
} from '../../../components/ui';
import { NotificationBell } from '../../../components/NotificationBell';
import { PressableScale, stagger } from '../../../lib/motion';
import { colors, STATUS, type TurnoStatus } from '../../../lib/theme';
import { formatFechaCorta } from '../../../lib/format';
import type { Turno } from '../../../services';

const NEXT: Record<string, { label: string; status: TurnoStatus }[]> = {
  PENDIENTE:  [{ label: 'Confirmar', status: 'CONFIRMADO' }, { label: 'Cancelar', status: 'CANCELADO' }],
  CONFIRMADO: [{ label: 'Completar', status: 'COMPLETADO' }, { label: 'Cancelar', status: 'CANCELADO' }],
  COMPLETADO: [],
  CANCELADO:  [],
};

export default function MedicoAgenda() {
  const { data: turnos, isLoading } = useMiAgenda();
  const updateStatus = useUpdateTurnoStatus();

  const [tab, setTab] = useState('proximos');
  const [modalTurno, setModalTurno] = useState<Turno | null>(null);
  const [selStatus, setSelStatus] = useState<TurnoStatus | ''>('');
  const [notas, setNotas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  const { proximos, historial } = useMemo(() => {
    const list = turnos ?? [];
    return {
      proximos: list.filter(t => t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'),
      historial: list.filter(t => t.status === 'COMPLETADO' || t.status === 'CANCELADO'),
    };
  }, [turnos]);

  const visibles = tab === 'proximos' ? proximos : historial;

  const openModal = (t: Turno) => { setModalTurno(t); setSelStatus(''); setNotas(t.notas ?? ''); setDiagnostico(t.diagnostico ?? ''); };

  const handleConfirmar = async () => {
    if (!modalTurno || !selStatus) return;
    try {
      await updateStatus.mutateAsync({ id: modalTurno.id, status: selStatus, notas: notas.trim() || undefined, diagnostico: diagnostico.trim() || undefined });
      setModalTurno(null);
      toast.success('Turno actualizado');
    } catch {
      toast.error('No se pudo actualizar el turno');
    }
  };

  const header = (
    <View className="pt-4 pb-1">
      <SegmentedTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'proximos', label: 'Próximos', count: proximos.length },
          { key: 'historial', label: 'Historial', count: historial.length },
        ]}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Atención" title="Mi agenda" subtitle="Confirmá, completá o cancelá tus turnos" right={<NotificationBell />} />

      {isLoading ? (
        <View className="px-4">{header}{[0, 1, 2].map(i => <Skeleton key={i} className="h-32 rounded-card mb-3" />)}</View>
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={t => t.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              className="pt-10"
              icon={<IconCalendar size={28} color={colors.brand[500]} />}
              title={tab === 'proximos' ? 'Sin turnos próximos' : 'Sin historial'}
              message={tab === 'proximos' ? 'Cuando te asignen turnos van a aparecer acá.' : 'Acá vas a ver los turnos completados y cancelados.'}
            />
          }
          renderItem={({ item, index }) => <MedicoTurnoCard item={item} index={index} onChangeStatus={() => openModal(item)} />}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
        />
      )}

      <Sheet visible={!!modalTurno} onClose={() => setModalTurno(null)} title="Cambiar estado del turno">
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
                  <PressableScale key={opt.status} onPress={() => setSelStatus(opt.status)} haptic="select"
                    style={{ borderWidth: 1.5, borderColor: sel ? tone.strip : colors.slate[200], backgroundColor: sel ? tone.soft : colors.white }}
                    className="flex-1 items-center py-3.5 rounded-field">
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

function MedicoTurnoCard({ item, index, onChangeStatus }: { item: Turno; index: number; onChangeStatus: () => void }) {
  const s = STATUS[item.status] ?? STATUS.PENDIENTE;
  const nextOpts = NEXT[item.status] ?? [];
  return (
    <Animated.View entering={stagger(index)}>
      <Card className="overflow-hidden flex-row">
        <View style={{ width: 4, backgroundColor: s.strip }} />
        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: -0.3 }}>{item.paciente?.apellido}, {item.paciente?.nombre}</Text>
              <Text className="text-[12px] text-slate-400 mt-0.5">DNI {item.paciente?.dni}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5"><IconCalendarCheck size={12} color={colors.slate[400]} /><Text className="text-[12px] text-slate-500 font-semibold capitalize">{formatFechaCorta(item.fecha)}</Text></View>
            <View className="flex-row items-center gap-1.5"><IconClock size={12} color={colors.slate[400]} /><Text className="text-[12px] text-slate-600 font-bold">{item.hora} hs</Text></View>
          </View>
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
