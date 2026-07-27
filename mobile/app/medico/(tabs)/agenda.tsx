import { useState, useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import Animated from 'react-native-reanimated';
import { useMiAgenda, useUpdateTurnoStatus } from '../../../hooks';
import {
  Card, Calendario, StatusBadge, Sheet, Button, Textarea, ScreenHeader, SegmentedTabs, EmptyState, Skeleton, toast,
  HoraTurno,
  IconCalendar, IconRefresh, IconX, IconChevronDown,
} from '../../../components/ui';
import type { MarcaDia } from '../../../components/ui';
import { NotificationBell } from '../../../components/NotificationBell';
import { PressableScale, stagger } from '../../../lib/motion';
import { type TurnoStatus } from '../../../lib/theme';
import { useTheme } from '../../../lib/useTheme';
import { claveFecha, fechaDeTurno } from '../../../lib/fechas';
import { formatFechaCorta } from '../../../lib/format';
import type { Turno } from '../../../services';

const NEXT: Record<string, { label: string; status: TurnoStatus }[]> = {
  PENDIENTE:  [{ label: 'Confirmar', status: 'CONFIRMADO' }, { label: 'Cancelar', status: 'CANCELADO' }],
  CONFIRMADO: [{ label: 'Completar', status: 'COMPLETADO' }, { label: 'Cancelar', status: 'CANCELADO' }],
  COMPLETADO: [],
  CANCELADO:  [],
};

export default function MedicoAgenda() {
  const { colors, STATUS } = useTheme();
  const { data: turnos, isLoading } = useMiAgenda();
  const updateStatus = useUpdateTurnoStatus();

  const [tab, setTab] = useState('proximos');
  const [modalTurno, setModalTurno] = useState<Turno | null>(null);
  const [selStatus, setSelStatus] = useState<TurnoStatus | ''>('');
  const [notas, setNotas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [verCalendario, setVerCalendario] = useState(false);
  // Día elegido en el calendario ("YYYY-MM-DD"). Filtra la lista en vez de abrir un Sheet:
  // esta es la vista de trabajo del médico, lo que quiere es ver ese día en detalle.
  const [diaFiltro, setDiaFiltro] = useState<string | null>(null);

  const { proximos, historial } = useMemo(() => {
    const list = turnos ?? [];
    return {
      proximos: list.filter(t => t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'),
      historial: list.filter(t => t.status === 'COMPLETADO' || t.status === 'CANCELADO'),
    };
  }, [turnos]);

  // El calendario marca TODA la agenda, no solo la pestaña activa: si el médico está en
  // "Próximos" igual tiene que ver que el martes pasado atendió a alguien.
  const marcas = useMemo(() => {
    const out: Record<string, MarcaDia[]> = {};
    for (const t of turnos ?? []) {
      (out[claveFecha(t.fecha)] ??= []).push({ key: t.id, color: STATUS[t.status].dot });
    }
    return out;
  }, [turnos, STATUS]);

  const visibles = useMemo(() => {
    const base = tab === 'proximos' ? proximos : historial;
    return diaFiltro ? base.filter(t => claveFecha(t.fecha) === diaFiltro) : base;
  }, [tab, proximos, historial, diaFiltro]);

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
      <PressableScale
        onPress={() => setVerCalendario(v => !v)}
        haptic="select"
        className="flex-row items-center justify-between rounded-xl bg-surface border border-slate-100 px-3.5 py-2.5 mb-3"
      >
        <View className="flex-row items-center gap-2">
          <IconCalendar size={15} color={colors.brand[600]} />
          <Text className="text-[13px] font-bold text-slate-700">Calendario del mes</Text>
        </View>
        <View style={{ transform: [{ rotate: verCalendario ? '180deg' : '0deg' }] }}>
          <IconChevronDown size={17} color={colors.slate[500]} />
        </View>
      </PressableScale>

      {verCalendario ? (
        <View className="mb-3">
          <Calendario
            densidad="compacta"
            titulo="Tu agenda"
            ayuda="Tocá un día para ver solo esos turnos."
            marcas={marcas}
            seleccion={diaFiltro}
            deshabilitar={(fecha) => !marcas[fecha]}
            onSelect={(fecha) => setDiaFiltro(actual => (actual === fecha ? null : fecha))}
          />
        </View>
      ) : null}

      {diaFiltro ? (
        <PressableScale
          onPress={() => setDiaFiltro(null)}
          haptic="select"
          className="flex-row items-center justify-between rounded-pill bg-brand-50 border border-brand-100 px-3.5 py-2 mb-3"
        >
          <Text className="text-[12px] font-bold text-brand-700">
            Viendo el {formatFechaCorta(fechaDeTurno(diaFiltro).toISOString())}
          </Text>
          <IconX size={14} color={colors.brand[700]} />
        </PressableScale>
      ) : null}

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
              title={
                diaFiltro
                  ? 'Sin turnos ese día'
                  : tab === 'proximos' ? 'Sin turnos próximos' : 'Sin historial'
              }
              message={
                diaFiltro
                  ? `No hay turnos ${tab === 'proximos' ? 'próximos' : 'del historial'} ese día. Tocá la cruz para ver todos.`
                  : tab === 'proximos' ? 'Cuando te asignen turnos van a aparecer acá.' : 'Acá vas a ver los turnos completados y cancelados.'
              }
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

function MedicoTurnoCard({ item, index, onChangeStatus }: { item: Turno; index: number; onChangeStatus: () => void }) {
  const { colors } = useTheme();
  const nextOpts = NEXT[item.status] ?? [];
  return (
    <Animated.View entering={stagger(index)}>
      <Card className="overflow-hidden flex-row">
        <HoraTurno hora={item.hora} fecha={item.fecha} />
        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between mb-1">
            <View className="flex-1 mr-2">
              <Text className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: -0.3 }}>{item.paciente?.apellido}, {item.paciente?.nombre}</Text>
              <Text className="text-[12px] text-slate-400 mt-0.5">DNI {item.paciente?.dni}</Text>
            </View>
            <StatusBadge status={item.status} />
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
