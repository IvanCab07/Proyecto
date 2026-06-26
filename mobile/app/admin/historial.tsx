import { useState } from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHistorialPaciente, useCrearReceta, useMedicos } from '../../hooks';
import { getApiUrl } from '../../services/api';
import {
  Card, Avatar, SegmentedTabs, Sheet, Button, Input, Textarea, Chip, StatusBadge, ScreenHeader, EmptyState, Spinner, toast,
  IconCalendar, IconPill, IconFolder, IconPlus, IconClock, IconFileText, IconImage, IconExternal, IconCalendarCheck, IconArrowLeft,
} from '../../components/ui';
import { PressableScale } from '../../lib/motion';
import { colors, gradients, STATUS, type TurnoStatus } from '../../lib/theme';
import { apiError } from '../../lib/apiError';
import { formatFecha, formatFechaCorta } from '../../lib/format';
import type { Turno, Receta, Estudio } from '../../services';

type Tab = 'turnos' | 'recetas' | 'estudios';
const apiBase = () => getApiUrl().replace(/\/api$/, '');
const RECETA_INIT = { medicoId: '', medicamento: '', dosis: '', indicacion: '', validoHasta: '' };

export default function HistorialScreen() {
  const { pacienteId } = useLocalSearchParams<{ pacienteId: string }>();
  const { data, isLoading, refetch } = useHistorialPaciente(pacienteId);
  const { data: medicos } = useMedicos();
  const crearReceta = useCrearReceta();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('turnos');
  const [showRecetaModal, setShowRecetaModal] = useState(false);
  const [recetaForm, setRecetaForm] = useState(RECETA_INIT);

  if (!pacienteId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ScreenHeader eyebrow="Historial" title="Paciente" onBack={() => router.back()} />
        <EmptyState className="flex-1" icon={<IconFolder size={28} color={colors.brand[500]} />} title="Seleccioná un paciente" message='Desde "Pacientes" tocá un paciente para ver su historial.' />
      </View>
    );
  }

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}><Spinner size={26} /></View>;
  }
  if (!data) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}><Text className="text-slate-400">Paciente no encontrado</Text></View>;
  }

  const handleCrearReceta = async () => {
    if (!recetaForm.medicoId || !recetaForm.medicamento || !recetaForm.dosis || !recetaForm.indicacion) return toast.error('Completá todos los campos de la receta');
    try {
      const payload: any = { pacienteId, ...recetaForm };
      if (payload.validoHasta) payload.validoHasta = new Date(payload.validoHasta).toISOString();
      else delete payload.validoHasta;
      await crearReceta.mutateAsync(payload);
      await refetch();
      toast.success('Receta creada');
      setShowRecetaModal(false); setRecetaForm(RECETA_INIT);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo crear la receta'));
    }
  };

  const openEstudio = async (archivoUrl: string) => {
    const url = `${apiBase()}${archivoUrl}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else toast.error('Tu dispositivo no puede abrir este tipo de archivo');
    } catch {
      toast.error('No se pudo abrir el archivo');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Hero paciente */}
        <LinearGradient colors={gradients.railHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 10 }}>
          <View className="px-5 pt-1">
            <PressableScale onPress={() => router.back()} haptic="select" className="w-9 h-9 -ml-1 rounded-full items-center justify-center bg-white/10">
              <IconArrowLeft size={18} color="#fff" />
            </PressableScale>
          </View>
          <View className="px-5 pb-5 pt-2 flex-row items-center gap-3.5">
            <Avatar nombre={data.user.nombre} apellido={data.user.apellido} size={56} />
            <View className="flex-1">
              <Text className="text-brand-300 text-[11px] font-bold uppercase tracking-widest">Historial</Text>
              <Text className="text-white text-xl font-bold mt-0.5" style={{ letterSpacing: -0.4 }}>{data.user.apellido}, {data.user.nombre}</Text>
              <Text className="text-slate-400 text-[12px] mt-0.5">DNI {data.user.dni} · {data.user.email}</Text>
            </View>
          </View>
        </LinearGradient>

        <View className="px-4 py-3">
          <SegmentedTabs
            value={tab}
            onChange={(k) => setTab(k as Tab)}
            tabs={[
              { key: 'turnos', label: 'Turnos', count: data.turnos.length },
              { key: 'recetas', label: 'Recetas', count: data.recetas.length },
              { key: 'estudios', label: 'Estudios', count: data.estudios.length },
            ]}
          />
        </View>

        <View className="px-4">
          {tab === 'turnos' ? (
            data.turnos.length === 0
              ? <EmptyState className="pt-8" icon={<IconCalendar size={26} color={colors.brand[500]} />} title="Sin turnos registrados" />
              : <View className="gap-2.5">{data.turnos.map(t => <HistTurno key={t.id} t={t} />)}</View>
          ) : null}

          {tab === 'recetas' ? (
            <View>
              <Button fullWidth iconLeft={<IconPlus size={16} color="#fff" />} onPress={() => setShowRecetaModal(true)} className="mb-3">Nueva receta</Button>
              {data.recetas.length === 0
                ? <EmptyState className="pt-6" icon={<IconPill size={26} color={colors.brand[500]} />} title="Sin recetas registradas" />
                : <View className="gap-2.5">{data.recetas.map(r => <HistReceta key={r.id} r={r} />)}</View>}
            </View>
          ) : null}

          {tab === 'estudios' ? (
            data.estudios.length === 0
              ? <EmptyState className="pt-8" icon={<IconFolder size={26} color={colors.brand[500]} />} title="Sin estudios cargados" />
              : <View className="gap-2.5">{data.estudios.map(e => <HistEstudio key={e.id} e={e} onOpen={() => openEstudio(e.archivoUrl)} />)}</View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sheet nueva receta */}
      <Sheet visible={showRecetaModal} onClose={() => { setShowRecetaModal(false); setRecetaForm(RECETA_INIT); }} title="Nueva receta">
        <Text className="text-[13px] font-semibold text-slate-700 mb-2">Médico</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1 px-1" contentContainerStyle={{ gap: 8 }}>
          {medicos?.map(m => <Chip key={m.id} label={`Dr. ${m.apellido}`} active={recetaForm.medicoId === m.id} onPress={() => setRecetaForm(f => ({ ...f, medicoId: m.id }))} />)}
        </ScrollView>
        <Input label="Medicamento" placeholder="Ej: Ibuprofeno 400mg" value={recetaForm.medicamento} onChangeText={v => setRecetaForm(f => ({ ...f, medicamento: v }))} className="mb-3" />
        <Input label="Dosis" placeholder="Ej: 1 comprimido cada 8 horas" value={recetaForm.dosis} onChangeText={v => setRecetaForm(f => ({ ...f, dosis: v }))} className="mb-3" />
        <Textarea label="Indicación" placeholder="Ej: Tomar con las comidas durante 7 días" value={recetaForm.indicacion} onChangeText={v => setRecetaForm(f => ({ ...f, indicacion: v }))} className="mb-3" />
        <Input label="Válido hasta (opcional)" placeholder="2026-09-01" value={recetaForm.validoHasta} onChangeText={v => setRecetaForm(f => ({ ...f, validoHasta: v }))} className="mb-4" />
        <Button fullWidth loading={crearReceta.isPending} onPress={handleCrearReceta}>Emitir receta</Button>
      </Sheet>
    </View>
  );
}

function HistTurno({ t }: { t: Turno }) {
  const s = STATUS[t.status as TurnoStatus] ?? STATUS.PENDIENTE;
  return (
    <Card className="overflow-hidden flex-row">
      <View style={{ width: 4, backgroundColor: s.strip }} />
      <View className="flex-1 p-3.5">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-[14px] font-bold text-slate-900 flex-1 mr-2">Dr. {t.medico.apellido} — {t.medico.especialidad.nombre}</Text>
          <StatusBadge status={t.status} />
        </View>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1.5"><IconCalendarCheck size={12} color={colors.slate[400]} /><Text className="text-[12px] text-slate-500 font-semibold capitalize">{formatFechaCorta(t.fecha)}</Text></View>
          <View className="flex-row items-center gap-1.5"><IconClock size={12} color={colors.slate[400]} /><Text className="text-[12px] text-slate-600 font-bold">{t.hora} hs</Text></View>
        </View>
        {t.notas ? <View className="mt-2 rounded-lg p-2.5" style={{ backgroundColor: colors.info.soft, borderLeftWidth: 3, borderLeftColor: colors.info.DEFAULT }}><Text className="text-[12px]" style={{ color: colors.info.text }}>{t.notas}</Text></View> : null}
        {t.diagnostico ? <View className="mt-2 rounded-lg p-2.5" style={{ backgroundColor: colors.brand[50], borderLeftWidth: 3, borderLeftColor: colors.brand[600] }}><Text className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.brand[800] }}>Diagnóstico</Text><Text className="text-[12px] mt-0.5" style={{ color: colors.brand[800] }}>{t.diagnostico}</Text></View> : null}
      </View>
    </Card>
  );
}

function HistReceta({ r }: { r: Receta }) {
  return (
    <Card className="p-3.5">
      <View className="flex-row items-center gap-2.5 mb-2">
        <View className="w-10 h-10 rounded-xl bg-brand-50 items-center justify-center"><IconPill size={18} color={colors.brand[600]} /></View>
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-slate-900">{r.medicamento}</Text>
          <Text className="text-[12px] text-brand-700 font-semibold mt-0.5">{r.dosis}</Text>
        </View>
      </View>
      <Text className="text-[13px] text-slate-600 leading-5">{r.indicacion}</Text>
      <View className="flex-row justify-between mt-2.5 pt-2.5 border-t border-slate-100">
        <Text className="text-[12px] text-slate-500">Dr. {r.medico.apellido} · {r.medico.especialidad.nombre}</Text>
        <Text className="text-[11px] text-slate-400">{formatFecha(r.fechaEmision)}</Text>
      </View>
    </Card>
  );
}

function HistEstudio({ e, onOpen }: { e: Estudio; onOpen: () => void }) {
  const isPdf = e.tipoArchivo?.includes('pdf');
  const tone = isPdf ? colors.danger : colors.info;
  return (
    <Card className="flex-row items-center p-3.5">
      <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: tone.soft }}>
        {isPdf ? <IconFileText size={18} color={tone.DEFAULT} /> : <IconImage size={18} color={tone.DEFAULT} />}
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-slate-900" numberOfLines={1}>{e.titulo}</Text>
        {e.descripcion ? <Text className="text-[12px] text-slate-500 mt-0.5" numberOfLines={1}>{e.descripcion}</Text> : null}
        <Text className="text-[11px] text-slate-400 mt-0.5">{formatFecha(e.fecha)} · {isPdf ? 'PDF' : 'Imagen'}</Text>
      </View>
      <PressableScale onPress={onOpen} haptic="select" className="w-9 h-9 rounded-lg bg-slate-100 items-center justify-center ml-2">
        <IconExternal size={16} color={colors.slate[600]} />
      </PressableScale>
    </Card>
  );
}
