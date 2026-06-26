import { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, { SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { useEspecialidades, useMedicosPorEspecialidad, useCrearTurno, useDisponibilidad } from '../../../hooks';
import {
  Card, Button, Textarea, Avatar, Stepper, ScreenHeader, Spinner, toast,
  IconStethoscope, IconCheckCircle, IconChevronLeft, IconChevronRight, IconCalendarCheck, IconCheck, IconDoctor,
} from '../../../components/ui';
import { PressableScale } from '../../../lib/motion';
import { haptic } from '../../../lib/haptics';
import { colors, shadow } from '../../../lib/theme';
import { MESES_LARGO, DIAS_SEMANA } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { apiError } from '../../../lib/apiError';

const HORARIOS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

function useDatePicker() {
  const hoy = new Date();
  const [viewYear, setViewYear] = useState(hoy.getFullYear());
  const [viewMonth, setViewMonth] = useState(hoy.getMonth());
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay();
  return { viewYear, viewMonth, prevMonth, nextMonth, daysInMonth, firstWeekDay };
}

const STEPS_SHORT = ['Médico', 'Fecha', 'Confirmar'];
const STEPS_LONG = ['Especialidad y médico', 'Fecha y horario', 'Confirmar turno'];

export default function SolicitarTurnoScreen() {
  const params = useLocalSearchParams<{ prefillEspecialidadId?: string; prefillMedicoId?: string }>();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [especialidadId, setEspecialidadId] = useState(params.prefillEspecialidadId ?? '');
  const [medicoId, setMedicoId] = useState(params.prefillMedicoId ?? '');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => { if (params.prefillEspecialidadId && params.prefillMedicoId) setStep(2); }, []);

  const cal = useDatePicker();
  const { data: especialidades, isLoading: loadEsp } = useEspecialidades();
  const { data: medicos, isLoading: loadMed } = useMedicosPorEspecialidad(especialidadId);
  const { data: disponibilidad } = useDisponibilidad(medicoId, fecha);
  const crearTurno = useCrearTurno();

  const hoy = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const horasOcupadas = useMemo(() => new Set(disponibilidad?.horasOcupadas ?? []), [disponibilidad]);
  const sobreturnosPorHora = disponibilidad?.sobreturnos ?? {};
  // Si el horario elegido está ocupado, se pide como sobreturno (lista de espera)
  const esSobreturno = !!hora && horasOcupadas.has(hora);

  const goNext = () => { setDir(1); setStep(s => s + 1); };
  const goBack = () => { setDir(-1); setStep(s => s - 1); };

  const handleDayPress = (day: number) => {
    const d = new Date(cal.viewYear, cal.viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d < hoy) return;
    if (d.getDay() === 0) return;
    const mm = String(cal.viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setFecha(`${cal.viewYear}-${mm}-${dd}`);
    setHora('');
    haptic.select();
  };

  const selectedDay = useMemo(() => {
    if (!fecha) return null;
    const [y, m, d] = fecha.split('-').map(Number);
    if (y === cal.viewYear && m - 1 === cal.viewMonth) return d;
    return null;
  }, [fecha, cal.viewYear, cal.viewMonth]);

  const handleConfirmar = async () => {
    if (!medicoId || !fecha || !hora) return toast.error('Completá todos los campos');
    try {
      const fechaISO = new Date(`${fecha}T12:00:00`).toISOString();
      await crearTurno.mutateAsync({ medicoId, fecha: fechaISO, hora, motivo, esSobreturno });
      toast.success(esSobreturno ? 'Sobreturno solicitado: quedaste en lista de espera' : 'Turno solicitado');
      setDir(-1); setStep(1); setEspecialidadId(''); setMedicoId(''); setFecha(''); setHora(''); setMotivo('');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo crear el turno'));
    }
  };

  const selectedEsp = especialidades?.find(e => e.id === especialidadId);
  const selectedMed = medicos?.find(m => m.id === medicoId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Nuevo turno" title="Solicitar turno" />

      {/* Stepper */}
      <View className="px-4 pt-4">
        <Card className="px-4 py-3.5"><Stepper steps={STEPS_SHORT} current={step - 1} /></Card>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3">{STEPS_LONG[step - 1]}</Text>

        <Animated.View key={step} entering={(dir >= 0 ? SlideInRight : SlideInLeft).duration(260)}>
          {/* STEP 1 */}
          {step === 1 ? (
            <View>
              <Text className="text-sm font-bold text-slate-700 mb-3">Especialidad</Text>
              {loadEsp ? <Spinner /> : especialidades?.map(e => {
                const sel = especialidadId === e.id;
                return (
                  <PressableScale key={e.id} onPress={() => { setEspecialidadId(e.id); setMedicoId(''); }} haptic="select" style={sel ? shadow.xs : undefined}
                    className={cn('flex-row items-center p-4 rounded-card mb-2.5 border', sel ? 'bg-brand-600 border-brand-600' : 'bg-surface border-slate-200')}>
                    <View className={cn('w-9 h-9 rounded-xl items-center justify-center mr-3', sel ? 'bg-white/20' : 'bg-brand-50')}>
                      <IconStethoscope size={16} color={sel ? '#fff' : colors.brand[600]} />
                    </View>
                    <Text className={cn('font-semibold text-[15px] flex-1', sel ? 'text-white' : 'text-slate-900')}>{e.nombre}</Text>
                    {sel ? <IconCheck size={18} color="#fff" /> : null}
                  </PressableScale>
                );
              })}

              {especialidadId ? (
                <>
                  <Text className="text-sm font-bold text-slate-700 mt-5 mb-3">Médico disponible</Text>
                  {loadMed ? <Spinner /> : medicos?.length === 0 ? (
                    <Card className="p-5 items-center bg-warning-soft border-warning/30">
                      <IconDoctor size={26} color={colors.warning.DEFAULT} />
                      <Text className="font-bold text-center mt-2" style={{ color: colors.warning.text }}>Sin médicos disponibles para esta especialidad</Text>
                    </Card>
                  ) : medicos?.map(m => {
                    const sel = medicoId === m.id;
                    return (
                      <PressableScale key={m.id} onPress={() => setMedicoId(m.id)} haptic="select" style={sel ? shadow.xs : undefined}
                        className={cn('flex-row items-center p-4 rounded-card mb-2.5 border', sel ? 'bg-brand-600 border-brand-600' : 'bg-surface border-slate-200')}>
                        <Avatar nombre={m.nombre} apellido={m.apellido} size={40} />
                        <View className="flex-1 ml-3">
                          <Text className={cn('font-bold text-[15px]', sel ? 'text-white' : 'text-slate-900')}>Dr. {m.apellido}, {m.nombre}</Text>
                          <Text className={cn('text-[12px] mt-0.5', sel ? 'text-brand-100' : 'text-slate-500')}>Mat. {m.matricula}</Text>
                        </View>
                        {sel ? <IconCheck size={18} color="#fff" /> : null}
                      </PressableScale>
                    );
                  })}
                </>
              ) : null}

              {medicoId ? (
                <Button fullWidth size="lg" className="mt-2" onPress={goNext} iconRight={<IconChevronRight size={16} color="#fff" />}>Continuar</Button>
              ) : null}
            </View>
          ) : null}

          {/* STEP 2 */}
          {step === 2 ? (
            <View>
              <Card className="p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3.5">
                  <PressableScale onPress={cal.prevMonth} haptic="select" className="w-9 h-9 rounded-lg bg-slate-100 items-center justify-center"><IconChevronLeft size={14} color={colors.slate[600]} /></PressableScale>
                  <Text className="font-bold text-slate-900 text-[15px]">{MESES_LARGO[cal.viewMonth]} {cal.viewYear}</Text>
                  <PressableScale onPress={cal.nextMonth} haptic="select" className="w-9 h-9 rounded-lg bg-slate-100 items-center justify-center"><IconChevronRight size={14} color={colors.slate[600]} /></PressableScale>
                </View>

                <View className="flex-row mb-1.5">
                  {DIAS_SEMANA.map((d, i) => (
                    <View key={d} className="flex-1 items-center"><Text className="text-[11px] font-bold" style={{ color: i === 0 ? colors.danger.DEFAULT : colors.slate[400] }}>{d}</Text></View>
                  ))}
                </View>

                <View className="flex-row flex-wrap">
                  {Array.from({ length: cal.firstWeekDay }).map((_, i) => <View key={`e-${i}`} style={{ width: `${100 / 7}%` }} />)}
                  {Array.from({ length: cal.daysInMonth }, (_, i) => i + 1).map(day => {
                    const d = new Date(cal.viewYear, cal.viewMonth, day); d.setHours(0, 0, 0, 0);
                    const isPast = d < hoy;
                    const isDomingo = d.getDay() === 0;
                    const isBlocked = isPast || isDomingo;
                    const isSelected = selectedDay === day;
                    const isToday = d.getTime() === hoy.getTime();
                    return (
                      <Pressable key={day} onPress={() => handleDayPress(day)} disabled={isBlocked} style={{ width: `${100 / 7}%`, padding: 2 }}>
                        <View className="items-center justify-center rounded-lg py-2" style={{ backgroundColor: isSelected ? colors.brand[600] : isToday ? colors.brand[50] : 'transparent', borderWidth: isToday && !isSelected ? 1.5 : 0, borderColor: colors.brand[600] }}>
                          <Text style={{ fontSize: 13, fontWeight: isSelected || isToday ? '800' : '400', color: isSelected ? '#fff' : isBlocked ? (isDomingo ? '#fca5a5' : colors.slate[300]) : isToday ? colors.brand[700] : colors.slate[700] }}>{day}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {fecha ? (
                  <View className="flex-row items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    <IconCalendarCheck size={14} color={colors.success.DEFAULT} />
                    <Text className="text-[13px] font-semibold capitalize" style={{ color: colors.success.text }}>
                      {new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                  </View>
                ) : null}
              </Card>

              {fecha ? (
                <>
                  <Text className="text-sm font-bold text-slate-700 mb-3">Elegí un horario</Text>
                  <View className="flex-row flex-wrap gap-2 mb-2.5">
                    {HORARIOS.map(h => {
                      const ocupado = horasOcupadas.has(h);
                      const sel = hora === h;
                      const enEspera = sobreturnosPorHora[h] ?? 0;
                      return (
                        <PressableScale key={h} onPress={() => { setHora(h); haptic.select(); }} haptic={false}
                          className={cn('px-4 py-2.5 rounded-field border',
                            sel ? (ocupado ? 'bg-amber-500 border-amber-500' : 'bg-brand-600 border-brand-600')
                                : ocupado ? 'bg-amber-50 border-amber-300' : 'bg-surface border-slate-200')}>
                          <Text className={cn('text-[13px] font-bold', sel ? 'text-white' : ocupado ? 'text-amber-700' : 'text-slate-700')}>
                            {h}{enEspera > 0 ? ` ·${enEspera}` : ''}
                          </Text>
                        </PressableScale>
                      );
                    })}
                  </View>
                  <View className="flex-row items-center gap-2 mb-5">
                    <View className="w-3 h-3 rounded" style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D' }} />
                    <Text className="text-[12px] text-slate-500 flex-1">
                      Horario ocupado: lo podés tomar como <Text className="font-bold text-amber-700">sobreturno</Text> (lista de espera).
                    </Text>
                  </View>
                </>
              ) : null}

              <View className="flex-row gap-3">
                <View className="flex-1"><Button variant="secondary" fullWidth onPress={goBack} iconLeft={<IconChevronLeft size={16} color={colors.slate[600]} />}>Atrás</Button></View>
                <View className="flex-1"><Button fullWidth disabled={!fecha || !hora} onPress={goNext} iconRight={<IconChevronRight size={16} color="#fff" />}>Continuar</Button></View>
              </View>
            </View>
          ) : null}

          {/* STEP 3 */}
          {step === 3 ? (
            <View>
              <Card className="p-5 mb-4">
                <Text className="font-bold text-slate-900 text-base mb-3.5">Resumen del turno</Text>
                <SummaryRow label="Especialidad" value={selectedEsp?.nombre ?? '-'} />
                <SummaryRow label="Médico" value={selectedMed ? `Dr. ${selectedMed.apellido}, ${selectedMed.nombre}` : '-'} />
                <SummaryRow label="Fecha" value={fecha ? new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
                <SummaryRow label="Hora" value={hora ? `${hora} hs` : '-'} last />
              </Card>

              {esSobreturno ? (
                <View className="flex-row gap-2.5 p-3.5 mb-4 rounded-card" style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D' }}>
                  <IconCalendarCheck size={18} color={colors.warning.DEFAULT} />
                  <Text className="text-[13px] flex-1" style={{ color: '#92400E' }}>
                    Ese horario está ocupado. Vas a quedar como <Text className="font-bold">sobreturno</Text> en lista de espera:
                    si el turno se cancela o el paciente no asiste, se te cede automáticamente y te avisamos.
                  </Text>
                </View>
              ) : null}

              <Textarea label="Motivo de consulta (opcional)" placeholder="Describí brevemente el motivo de la consulta…" value={motivo} onChangeText={setMotivo} className="mb-5" />

              <View className="flex-row gap-3">
                <View className="flex-1"><Button variant="secondary" fullWidth onPress={goBack} iconLeft={<IconChevronLeft size={16} color={colors.slate[600]} />}>Atrás</Button></View>
                <View className="flex-1"><Button fullWidth loading={crearTurno.isPending} onPress={handleConfirmar} iconRight={<IconCheck size={16} color="#fff" />}>Confirmar turno</Button></View>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between py-2.5 ${last ? '' : 'border-b border-slate-100'}`}>
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className="text-slate-900 text-sm font-bold flex-1 text-right ml-4 capitalize">{value}</Text>
    </View>
  );
}
