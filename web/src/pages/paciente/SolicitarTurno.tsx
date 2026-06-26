import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useEspecialidades, useMedicosPorEspecialidad, useDisponibilidad, useCrearTurno } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { Card, Button, Input, Textarea, Stepper, EmptyState } from '../../ui';
import { IconCheck, IconChevronLeft, IconUser, IconAlert } from '../../ui/icons';
import { wizardStep } from '../../lib/motion';
import { formatFecha } from '../../lib/format';
import { apiError } from '../../lib/apiError';
import { cn } from '../../lib/cn';

const HORAS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
const PASOS = ['Especialidad', 'Médico', 'Fecha y hora', 'Confirmar'];

function OptionButton({ selected, disabled, onClick, children }: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-field text-sm transition-all duration-150',
        'ring-1 ring-inset disabled:opacity-40 disabled:cursor-not-allowed',
        selected
          ? 'ring-2 ring-brand-600 bg-brand-50'
          : 'ring-slate-200 bg-surface hover:ring-slate-400',
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected && (
        <span className="w-5 h-5 rounded-full bg-brand-600 text-white grid place-items-center shrink-0">
          <IconCheck className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}

export default function PacienteSolicitar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillEsp = searchParams.get('prefillEspecialidadId');
  const prefillMed = searchParams.get('prefillMedicoId');
  const prefilled = Boolean(prefillEsp && prefillMed);

  const [paso, setPaso] = useState(prefilled ? 3 : 1);
  const [dir, setDir] = useState(1);
  const [especialidadId, setEspecialidadId] = useState(prefilled ? prefillEsp! : '');
  const [medicoId, setMedicoId] = useState(prefilled ? prefillMed! : '');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const goTo = (siguiente: number) => {
    setDir(siguiente > paso ? 1 : -1);
    setPaso(siguiente);
  };

  const { data: especialidades } = useEspecialidades();
  const { data: medicos } = useMedicosPorEspecialidad(especialidadId);
  const { data: disponibilidad } = useDisponibilidad(medicoId, fecha);
  const crear = useCrearTurno();

  const horasOcupadas = disponibilidad?.horasOcupadas ?? [];
  const sobreturnosPorHora = disponibilidad?.sobreturnos ?? {};
  // Si el horario elegido está ocupado, se pide como sobreturno (lista de espera)
  const esSobreturno = !!hora && horasOcupadas.includes(hora);

  const today = new Date().toISOString().split('T')[0];

  const handleConfirmar = async () => {
    setError('');
    try {
      // El backend espera un datetime ISO completo; mandamos el mediodía de la fecha elegida.
      const fechaISO = new Date(`${fecha}T12:00:00`).toISOString();
      await crear.mutateAsync({ medicoId, fecha: fechaISO, hora, motivo: motivo || undefined, esSobreturno });
      toast.success(esSobreturno ? 'Sobreturno solicitado. Quedaste en lista de espera.' : 'Turno solicitado correctamente');
      navigate('/paciente/turnos');
    } catch (e) {
      setError(apiError(e, 'Error al crear el turno'));
    }
  };

  const medicoSeleccionado = medicos?.find(m => m.id === medicoId);
  const espSeleccionada = especialidades?.find(e => e.id === especialidadId);

  return (
    <PageTransition>
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 min-w-0">
        <div className="mb-7">
          <h1 className="text-[24px] font-bold tracking-tighter2 text-slate-900 mb-5">Solicitar turno</h1>
          <Stepper steps={PASOS} current={paso - 1} />
        </div>

        <Card className="p-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {paso === 1 && (
              <motion.div key={1} custom={dir} variants={wizardStep} initial="enter" animate="center" exit="exit" className="min-h-[280px]">
                <h2 className="font-semibold text-slate-900 mb-1">¿Qué especialidad necesitás?</h2>
                <p className="text-[13px] text-slate-500 mb-5">Elegí una para ver los médicos disponibles.</p>
                <div className="space-y-2">
                  {especialidades?.map(e => (
                    <OptionButton
                      key={e.id}
                      selected={especialidadId === e.id}
                      onClick={() => { setEspecialidadId(e.id); setMedicoId(''); goTo(2); }}
                    >
                      <span className="font-medium text-slate-800">{e.nombre}</span>
                      {e._count !== undefined && (
                        <span className="block text-xs text-slate-400 mt-0.5">
                          {e._count.medicos} {e._count.medicos === 1 ? 'médico' : 'médicos'}
                        </span>
                      )}
                    </OptionButton>
                  ))}
                </div>
              </motion.div>
            )}

            {paso === 2 && (
              <motion.div key={2} custom={dir} variants={wizardStep} initial="enter" animate="center" exit="exit" className="min-h-[280px] flex flex-col">
                <h2 className="font-semibold text-slate-900 mb-1">Elegí tu médico</h2>
                <p className="text-[13px] text-slate-500 mb-5">{espSeleccionada?.nombre}</p>
                {!medicos?.length ? (
                  <EmptyState
                    icon={<IconUser />}
                    title="Sin médicos disponibles"
                    description="Por ahora no hay médicos para esta especialidad. Probá con otra."
                  />
                ) : (
                  <div className="space-y-2">
                    {medicos.map(m => (
                      <OptionButton
                        key={m.id}
                        selected={medicoId === m.id}
                        disabled={!m.disponible}
                        onClick={() => { setMedicoId(m.id); goTo(3); }}
                      >
                        <span className="font-medium text-slate-800">Dr. {m.nombre} {m.apellido}</span>
                        <span className="block text-xs text-slate-400 mt-0.5">
                          Matrícula {m.matricula}{!m.disponible && ' · No disponible'}
                        </span>
                      </OptionButton>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-5">
                  <Button variant="ghost" size="sm" iconLeft={<IconChevronLeft />} onClick={() => goTo(1)}>
                    Volver
                  </Button>
                </div>
              </motion.div>
            )}

            {paso === 3 && (
              <motion.div key={3} custom={dir} variants={wizardStep} initial="enter" animate="center" exit="exit" className="min-h-[280px] flex flex-col">
                <h2 className="font-semibold text-slate-900 mb-1">¿Cuándo te queda bien?</h2>
                <p className="text-[13px] text-slate-500 mb-5">
                  {medicoSeleccionado ? `Dr. ${medicoSeleccionado.nombre} ${medicoSeleccionado.apellido}` : 'Elegí fecha y horario.'}
                </p>
                <Input
                  label="Fecha"
                  type="date"
                  value={fecha}
                  min={today}
                  onChange={e => { setFecha(e.target.value); setHora(''); }}
                  className="mb-5"
                />
                {fecha && (
                  <div>
                    <p className="text-[13px] font-semibold text-slate-700 mb-2">Elegí un horario</p>
                    <div className="grid grid-cols-4 gap-2">
                      {HORAS.map(h => {
                        const ocupado = horasOcupadas.includes(h);
                        const activo = hora === h;
                        const enEspera = sobreturnosPorHora[h] ?? 0;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHora(h)}
                            title={ocupado ? 'Horario ocupado — lo podés tomar como sobreturno' : undefined}
                            className={cn(
                              'h-9 rounded-lg text-[13px] font-semibold tnum transition-all duration-150 relative',
                              activo
                                ? ocupado
                                  ? 'bg-amber-500 text-white shadow-btn'
                                  : 'bg-brand-600 text-white shadow-btn'
                                : ocupado
                                  ? 'bg-amber-50 ring-1 ring-inset ring-amber-300 text-amber-700 hover:ring-amber-400'
                                  : 'bg-surface ring-1 ring-inset ring-slate-200 text-slate-600 hover:ring-slate-400 hover:text-slate-900',
                            )}
                          >
                            {h}
                            {enEspera > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold grid place-items-center ring-2 ring-surface">
                                {enEspera}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-[12px] text-slate-500">
                      <span className="inline-block w-3 h-3 rounded bg-amber-50 ring-1 ring-amber-300" />
                      Horario ocupado: lo podés tomar como <span className="font-semibold text-amber-700">sobreturno</span> (lista de espera).
                    </p>
                  </div>
                )}
                <div className="flex justify-between mt-auto pt-6">
                  <Button variant="ghost" size="sm" iconLeft={<IconChevronLeft />} onClick={() => goTo(2)}>
                    Volver
                  </Button>
                  <Button onClick={() => goTo(4)} disabled={!fecha || !hora}>
                    Continuar
                  </Button>
                </div>
              </motion.div>
            )}

            {paso === 4 && (
              <motion.div key={4} custom={dir} variants={wizardStep} initial="enter" animate="center" exit="exit" className="min-h-[280px] flex flex-col">
                <h2 className="font-semibold text-slate-900 mb-5">Revisá y confirmá</h2>
                <dl className="divide-y divide-slate-100 rounded-field bg-slate-50 ring-1 ring-inset ring-slate-200 px-4 mb-5 text-sm">
                  {[
                    ['Especialidad', espSeleccionada?.nombre],
                    ['Médico', medicoSeleccionado ? `Dr. ${medicoSeleccionado.nombre} ${medicoSeleccionado.apellido}` : ''],
                    ['Fecha', fecha ? formatFecha(fecha) : ''],
                    ['Hora', hora ? `${hora} hs` : ''],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2.5">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-medium text-slate-900 text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
                {esSobreturno && (
                  <div className="flex items-start gap-2.5 bg-amber-50 text-amber-800 ring-1 ring-amber-200 rounded-field px-3.5 py-3 text-[13px] font-medium mb-4">
                    <IconAlert className="shrink-0 mt-0.5" />
                    <span>
                      Ese horario ya está ocupado. Vas a quedar como <span className="font-semibold">sobreturno</span> en
                      lista de espera: si el turno se cancela o el paciente no asiste, se te cede automáticamente y te avisamos.
                    </span>
                  </div>
                )}
                <Textarea
                  label="Motivo de la consulta"
                  hint="Opcional — ayuda al médico a prepararse"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  rows={3}
                  placeholder="Contanos brevemente qué te trae…"
                />
                {error && (
                  <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium mt-4">
                    <IconAlert className="shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex justify-between mt-auto pt-6">
                  <Button variant="ghost" size="sm" iconLeft={<IconChevronLeft />} onClick={() => goTo(3)}>
                    Volver
                  </Button>
                  <Button onClick={handleConfirmar} loading={crear.isPending}>
                    {esSobreturno ? 'Confirmar sobreturno' : 'Confirmar turno'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        </div>

        {/* Panel resumen — se llena a medida que elegís, para no dejar el lienzo vacío */}
        <aside className="hidden lg:block lg:sticky lg:top-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Resumen del turno</h3>
            <dl className="space-y-3 text-sm">
              {[
                ['Especialidad', espSeleccionada?.nombre],
                ['Médico', medicoSeleccionado ? `Dr. ${medicoSeleccionado.nombre} ${medicoSeleccionado.apellido}` : ''],
                ['Fecha', fecha ? formatFecha(fecha) : ''],
                ['Hora', hora ? `${hora} hs` : ''],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500 shrink-0">{k}</dt>
                  <dd className={cn('font-medium text-right', v ? 'text-slate-900' : 'text-slate-300')}>
                    {v || 'Pendiente'}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5 bg-brand-50 ring-1 ring-brand-100">
            <p className="text-[13px] font-semibold text-brand-900 mb-1">¿Cómo funciona?</p>
            <p className="text-[13px] text-brand-800/80 leading-relaxed">
              Elegí especialidad, médico, y un horario libre. Vas a poder ver y cancelar el turno
              desde <span className="font-semibold">Mis turnos</span>.
            </p>
          </Card>
        </aside>
      </div>
    </PageTransition>
  );
}
