import { useState, useMemo } from 'react';
import { View, Text, SectionList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useMisTurnos, useCancelarTurno, useCrearCalificacion } from '../../../hooks';
import { useAuthStore } from '../../../hooks/useAuthStore';
import {
  Card, StatusBadge, Stars, SegmentedTabs, Sheet, Button, Textarea, ScreenHeader, EmptyState, Skeleton, toast,
  IconClock, IconCheckCircle, IconCalendar, IconCalendarCheck, IconX, IconRefresh, IconStar, IconChevronLeft, IconChevronRight,
} from '../../../components/ui';
import { PressableScale, stagger } from '../../../lib/motion';
import { colors, STATUS } from '../../../lib/theme';
import { formatFechaCorta } from '../../../lib/format';
import { apiError } from '../../../lib/apiError';
import type { Turno } from '../../../services';

type Tab = 'proximos' | 'historial';

export default function TurnosScreen() {
  const { data: turnos, isLoading, isRefetching, refetch } = useMisTurnos();
  const cancelar = useCancelarTurno();
  const calificar = useCrearCalificacion();
  const { user } = useAuthStore();
  const puedeCalificar = user?.puedeCalificar !== false;
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('proximos');
  const [cancelModal, setCancelModal] = useState<Turno | null>(null);
  const [razon, setRazon] = useState('');
  const [calificarModal, setCalificarModal] = useState<Turno | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [turnosDelDia, setTurnosDelDia] = useState<Turno[] | null>(null);

  const handleCancelar = (t: Turno) => { setCancelModal(t); setRazon(''); };

  const handleCalificar = (t: Turno) => { setCalificarModal(t); setEstrellas(0); setComentario(''); };

  const confirmarCalificacion = () => {
    if (!calificarModal) return;
    if (estrellas < 1) { toast.error('Elegí al menos una estrella'); return; }
    calificar.mutate(
      { turnoId: calificarModal.id, estrellas, comentario: comentario.trim() || undefined },
      {
        onSuccess: () => { setCalificarModal(null); toast.success('¡Gracias por tu calificación!'); },
        onError: (err) => toast.error(apiError(err, 'No se pudo enviar la calificación')),
      },
    );
  };

  const confirmarCancelacion = () => {
    if (!cancelModal) return;
    cancelar.mutate(
      { id: cancelModal.id, razonCancelacion: razon.trim() || undefined },
      {
        onSuccess: () => { setCancelModal(null); toast.success('Turno cancelado'); },
        onError: (err) => toast.error(apiError(err, 'No se pudo cancelar')),
      },
    );
  };

  const handleReagendar = (t: Turno) => {
    router.push({
      pathname: '/patient/solicitar',
      params: { prefillEspecialidadId: t.medico.especialidad.id ?? '', prefillMedicoId: t.medico.id },
    } as any);
  };

  const proximos = useMemo(() =>
    (turnos ?? []).filter(t => t.status === 'PENDIENTE' || t.status === 'CONFIRMADO' || t.status === 'EN_ESPERA')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [turnos]);

  const historial = useMemo(() =>
    (turnos ?? []).filter(t => t.status === 'COMPLETADO' || t.status === 'CANCELADO' || t.status === 'AUSENTE')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    [turnos]);

  const currentList = tab === 'proximos' ? proximos : historial;

  const sections = useMemo(() => {
    if (currentList.length === 0) return [];
    if (tab === 'proximos') {
      const hoyStr = new Date().toDateString();
      const mananaStr = new Date(Date.now() + 86400000).toDateString();
      const hoy = currentList.filter(t => new Date(t.fecha).toDateString() === hoyStr);
      const manana = currentList.filter(t => new Date(t.fecha).toDateString() === mananaStr);
      const resto = currentList.filter(t => {
        const s = new Date(t.fecha).toDateString();
        return s !== hoyStr && s !== mananaStr;
      });
      return [
        ...(hoy.length ? [{ title: 'Hoy', data: hoy }] : []),
        ...(manana.length ? [{ title: 'Mañana', data: manana }] : []),
        ...(resto.length ? [{ title: 'Próximamente', data: resto }] : []),
      ];
    }
    return [{ title: 'Historial', data: currentList }];
  }, [currentList, tab]);

  const completados = historial.filter(t => t.status === 'COMPLETADO').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Bienvenido/a" title={`${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() || 'Mis turnos'}>
        <View className="flex-row gap-2.5">
          <Pill icon={<IconClock size={14} color={colors.warning.DEFAULT} />} value={proximos.length} label="Próximos" />
          <Pill icon={<IconCheckCircle size={14} color={colors.success.DEFAULT} />} value={completados} label="Completados" />
          <Pill icon={<IconCalendar size={14} color={colors.brand[300]} />} value={turnos?.length ?? 0} label="Total" />
        </View>
      </ScreenHeader>

      <View className="px-4 pt-3">
        <CalendarioTurnos turnos={turnos ?? []} onSelectDay={setTurnosDelDia} />
      </View>

      <View className="px-4 py-3">
        <SegmentedTabs
          value={tab}
          onChange={(k) => setTab(k as Tab)}
          tabs={[
            { key: 'proximos', label: 'Próximos', count: proximos.length },
            { key: 'historial', label: 'Historial', count: historial.length },
          ]}
        />
      </View>

      {isLoading ? (
        <View className="px-4 gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-36 rounded-card" />)}</View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={t => t.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-12"
              icon={<IconCalendar size={28} color={colors.brand[500]} />}
              title={tab === 'proximos' ? 'Sin turnos próximos' : 'Sin historial'}
              message={tab === 'proximos' ? 'Solicitá un turno desde el botón central.' : 'Acá aparecerán tus turnos completados y cancelados.'}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 mt-3">{section.title}</Text>
          )}
          renderItem={({ item, index }) => (
            <TurnoCard item={item} index={index} onCancelar={handleCancelar} onReagendar={handleReagendar} onCalificar={handleCalificar} puedeCalificar={puedeCalificar} />
          )}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
        />
      )}

      <Sheet visible={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancelar turno">
        {cancelModal ? (
          <Text className="text-[13px] text-slate-400 mb-4">
            Dr. {cancelModal.medico.apellido} · {new Date(cancelModal.fecha).toLocaleDateString('es-AR')} {cancelModal.hora}
          </Text>
        ) : null}
        <Textarea label="Razón de cancelación (opcional)" placeholder="Ej: No puedo asistir, tengo otro compromiso…" value={razon} onChangeText={setRazon} className="mb-4" />
        <View className="flex-row gap-3">
          <View className="flex-1"><Button variant="secondary" fullWidth onPress={() => setCancelModal(null)}>Volver</Button></View>
          <View className="flex-1"><Button variant="danger" fullWidth loading={cancelar.isPending} onPress={confirmarCancelacion}>Cancelar turno</Button></View>
        </View>
      </Sheet>

      <Sheet visible={!!calificarModal} onClose={() => setCalificarModal(null)} title="Calificar atención">
        {calificarModal ? (
          <Text className="text-[13px] text-slate-400 mb-4">
            Dr. {calificarModal.medico.apellido} · {new Date(calificarModal.fecha).toLocaleDateString('es-AR')}
          </Text>
        ) : null}
        <Text className="text-[13px] font-bold text-slate-700 mb-2">¿Cómo fue la atención?</Text>
        <View className="items-center mb-4">
          <Stars value={estrellas} onChange={setEstrellas} size={40} />
        </View>
        <Textarea label="Comentario (opcional)" placeholder="Contanos tu experiencia…" value={comentario} onChangeText={setComentario} className="mb-4" />
        <View className="flex-row gap-3">
          <View className="flex-1"><Button variant="secondary" fullWidth onPress={() => setCalificarModal(null)}>Volver</Button></View>
          <View className="flex-1"><Button fullWidth loading={calificar.isPending} onPress={confirmarCalificacion}>Enviar</Button></View>
        </View>
      </Sheet>

      <Sheet visible={!!turnosDelDia} onClose={() => setTurnosDelDia(null)} title="Turnos del día">
        <View className="gap-3 pb-2">
          {turnosDelDia?.map(turno => (
            <View key={turno.id} className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-slate-900">Dr. {turno.medico.nombre} {turno.medico.apellido}</Text>
                  <Text className="text-[13px] font-semibold text-brand-700 mt-0.5">{turno.medico.especialidad.nombre}</Text>
                </View>
                <StatusBadge status={turno.status} />
              </View>
              <View className="flex-row items-center gap-1.5 mt-2">
                <IconClock size={14} color={colors.slate[500]} />
                <Text className="text-[13px] font-bold text-slate-700">{turno.hora} hs</Text>
              </View>
              <Text className="text-[13px] text-slate-600 mt-1.5"><Text className="font-bold text-slate-700">Motivo: </Text>{turno.motivo || 'Sin motivo informado'}</Text>
            </View>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const MESES_COMPLETOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function claveFecha(fecha: string) {
  return fecha.slice(0, 10);
}

function CalendarioTurnos({ turnos, onSelectDay }: { turnos: Turno[]; onSelectDay: (turnos: Turno[]) => void }) {
  const hoy = new Date();
  const [mesVisible, setMesVisible] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const turnosPorFecha = useMemo(() => turnos.reduce<Record<string, Turno[]>>((acumulado, turno) => {
    const fecha = claveFecha(turno.fecha);
    (acumulado[fecha] ??= []).push(turno);
    return acumulado;
  }, {}), [turnos]);
  const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1);
  const ultimoDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0);
  const espaciosIniciales = (primerDia.getDay() + 6) % 7;
  const celdas: Array<Date | null> = [
    ...Array.from({ length: espaciosIniciales }, () => null),
    ...Array.from({ length: ultimoDia.getDate() }, (_, indice) => new Date(mesVisible.getFullYear(), mesVisible.getMonth(), indice + 1)),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <Card className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-[16px] font-bold text-slate-900">Calendario de turnos</Text>
          <Text className="text-[12px] text-slate-400 mt-0.5">Tocá un día marcado para ver el detalle.</Text>
        </View>
        <View className="flex-row gap-1">
          <Pressable accessibilityLabel="Mes anterior" onPress={() => setMesVisible(actual => new Date(actual.getFullYear(), actual.getMonth() - 1, 1))} className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center"><IconChevronLeft size={17} color={colors.slate[600]} /></Pressable>
          <Pressable accessibilityLabel="Mes siguiente" onPress={() => setMesVisible(actual => new Date(actual.getFullYear(), actual.getMonth() + 1, 1))} className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center"><IconChevronRight size={17} color={colors.slate[600]} /></Pressable>
        </View>
      </View>
      <Text className="text-center text-[14px] font-bold text-slate-900 mb-3">{MESES_COMPLETOS[mesVisible.getMonth()]} {mesVisible.getFullYear()}</Text>
      <View className="flex-row mb-1">
        {DIAS_SEMANA.map(dia => <Text key={dia} className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase">{dia}</Text>)}
      </View>
      {Array.from({ length: celdas.length / 7 }, (_, fila) => (
        <View key={fila} className="flex-row mb-1">
          {celdas.slice(fila * 7, fila * 7 + 7).map((dia, columna) => {
            if (!dia) return <View key={columna} className="flex-1 h-10" />;
            const fecha = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
            const turnosDia = turnosPorFecha[fecha] ?? [];
            const tieneTurnos = turnosDia.length > 0;
            const esHoy = dia.getFullYear() === hoy.getFullYear() && dia.getMonth() === hoy.getMonth() && dia.getDate() === hoy.getDate();
            return (
              <View key={fecha} className="flex-1 px-0.5">
                <Pressable
                  disabled={!tieneTurnos}
                  accessibilityLabel={tieneTurnos ? `${dia.getDate()} de ${MESES_COMPLETOS[dia.getMonth()]}, ${turnosDia.length} turnos` : undefined}
                  onPress={() => onSelectDay(turnosDia)}
                  className={`h-10 rounded-lg items-center justify-center ${tieneTurnos ? 'bg-brand-50 border border-brand-100' : ''} ${esHoy ? 'border-2 border-brand-500' : ''}`}
                >
                  <Text className={`text-[13px] font-bold ${tieneTurnos ? 'text-brand-700' : 'text-slate-600'}`}>{dia.getDate()}</Text>
                  {tieneTurnos ? <View className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-600" /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

function Pill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
      {icon}
      <Text className="text-white font-bold text-[22px] mt-1" style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}>{value}</Text>
      <Text className="text-slate-400 text-[11px] font-medium mt-0.5">{label}</Text>
    </View>
  );
}

function InfoBox({ tone, label, text }: { tone: { soft: string; DEFAULT: string; text: string }; label: string; text: string }) {
  return (
    <View className="mt-2 rounded-lg p-2.5" style={{ backgroundColor: tone.soft, borderLeftWidth: 3, borderLeftColor: tone.DEFAULT }}>
      <Text className="text-[11px] font-bold" style={{ color: tone.text }}>{label}</Text>
      <Text className="text-[12px] mt-0.5" style={{ color: tone.text }}>{text}</Text>
    </View>
  );
}

function TurnoCard({ item, index, onCancelar, onReagendar, onCalificar, puedeCalificar }: {
  item: Turno; index: number;
  onCancelar: (t: Turno) => void; onReagendar: (t: Turno) => void; onCalificar: (t: Turno) => void;
  puedeCalificar: boolean;
}) {
  const s = STATUS[item.status] ?? STATUS.PENDIENTE;
  return (
    <Animated.View entering={stagger(index)}>
      <Card className="overflow-hidden flex-row">
        <View style={{ width: 4, backgroundColor: s.strip }} />
        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2.5">
              <Text className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: -0.2 }}>Dr. {item.medico.apellido}, {item.medico.nombre}</Text>
              <Text className="text-[13px] text-brand-700 font-semibold mt-0.5">{item.medico.especialidad.nombre}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              {item.esSobreturno ? (
                <View className="px-2 py-1 rounded-pill" style={{ backgroundColor: '#FEF3C7' }}>
                  <Text className="text-[11px] font-bold" style={{ color: '#B45309' }}>Sobreturno</Text>
                </View>
              ) : null}
              <StatusBadge status={item.status} />
            </View>
          </View>

          <View className="flex-row items-center gap-4 bg-slate-50 rounded-lg p-2.5">
            <View className="flex-row items-center gap-1.5">
              <IconCalendarCheck size={13} color={colors.slate[500]} />
              <Text className="text-[13px] text-slate-600 font-semibold capitalize">{formatFechaCorta(item.fecha)}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <IconClock size={13} color={colors.slate[500]} />
              <Text className="text-[13px] text-slate-700 font-bold">{item.hora} hs</Text>
            </View>
          </View>

          {item.status === 'EN_ESPERA' ? (
            <Text className="text-[12px] mt-2" style={{ color: colors.info.text }}>
              En lista de espera. Si se libera el horario, se te cede automáticamente y te avisamos.
            </Text>
          ) : null}

          {item.motivo ? <Text className="text-[12px] text-slate-400 mt-2">Motivo: {item.motivo}</Text> : null}
          {item.notas ? <InfoBox tone={colors.info} label="Nota del médico" text={item.notas} /> : null}
          {item.diagnostico ? <InfoBox tone={{ soft: colors.brand[50], DEFAULT: colors.brand[600], text: colors.brand[800] }} label="Diagnóstico" text={item.diagnostico} /> : null}
          {item.razonCancelacion ? <InfoBox tone={colors.danger} label="Razón de cancelación" text={item.razonCancelacion} /> : null}

          {item.status === 'COMPLETADO' && item.calificacion ? (
            <View className="mt-2 rounded-lg p-2.5" style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' }}>
              <View className="flex-row items-center gap-2">
                <Stars value={item.calificacion.estrellas} size={15} />
                <Text className="text-[11px] font-bold" style={{ color: '#B45309' }}>Tu calificación</Text>
              </View>
              {item.calificacion.comentario ? <Text className="text-[12px] text-slate-600 mt-1 italic">“{item.calificacion.comentario}”</Text> : null}
            </View>
          ) : null}

          {(item.status === 'PENDIENTE' || item.status === 'EN_ESPERA') ? (
            <PressableScale onPress={() => onCancelar(item)} haptic="warning" className="mt-3 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5 bg-danger-soft border border-danger/20">
              <IconX size={14} color={colors.danger.text} />
              <Text className="text-[13px] font-bold" style={{ color: colors.danger.text }}>{item.status === 'EN_ESPERA' ? 'Cancelar sobreturno' : 'Cancelar turno'}</Text>
            </PressableScale>
          ) : null}
          {(item.status === 'CANCELADO' || item.status === 'AUSENTE') ? (
            <PressableScale onPress={() => onReagendar(item)} haptic="medium" className="mt-3 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5 bg-brand-50 border border-brand-100">
              <IconRefresh size={14} color={colors.brand[700]} />
              <Text className="text-[13px] font-bold text-brand-700">Reagendar</Text>
            </PressableScale>
          ) : null}
          {item.status === 'COMPLETADO' && !item.calificacion && puedeCalificar ? (
            <PressableScale onPress={() => onCalificar(item)} haptic="medium" className="mt-3 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5 bg-amber-50 border border-amber-200">
              <IconStar size={14} color="#B45309" />
              <Text className="text-[13px] font-bold" style={{ color: '#B45309' }}>Calificar atención</Text>
            </PressableScale>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}
