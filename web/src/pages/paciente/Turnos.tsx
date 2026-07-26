import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useMisTurnos, useCancelarTurno, useCrearCalificacion } from '../../hooks';
import { useAuthStore } from '../../store/useAuthStore';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Tabs, StatusBadge, Stars, EmptyState, ConfirmDialog, Dialog, Textarea, SkeletonCards, PageHeader,
  Calendario,
} from '../../ui';
import { IconCalendar, IconPlus, IconClock } from '../../ui/icons';
import { listContainer, listItem } from '../../lib/motion';
import { formatFecha } from '../../lib/format';
import { claveFecha, fechaDeTurno } from '../../lib/fechas';
import { apiError } from '../../lib/apiError';
import type { Turno } from '../../services';
import toast from 'react-hot-toast';

function isSameDay(fechaStr: string, ref: Date) {
  const d = new Date(fechaStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

function groupProximos(turnos: Turno[]) {
  const hoy: Turno[] = [], manana: Turno[] = [], proximos: Turno[] = [];
  const ahora = new Date();
  const sigDia = new Date();
  sigDia.setDate(sigDia.getDate() + 1);
  turnos.forEach(t => {
    if (isSameDay(t.fecha, ahora)) hoy.push(t);
    else if (isSameDay(t.fecha, sigDia)) manana.push(t);
    else proximos.push(t);
  });
  return { hoy, manana, proximos };
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function CalendarioTurnos({ turnos }: { turnos: Turno[] }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);

  const turnosSeleccionados = fechaSeleccionada
    ? turnos.filter(t => claveFecha(t.fecha) === fechaSeleccionada)
    : [];
  const fechaDetalle = fechaSeleccionada ? fechaDeTurno(fechaSeleccionada) : null;

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Calendario de turnos</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Seleccioná un día marcado para ver el detalle.</p>
      </div>
      <div className="px-3 sm:px-5 pt-4 pb-5">
        <Calendario
          turnos={turnos}
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionar={setFechaSeleccionada}
          permitirDiasVacios={false}
        />
      </div>
      <Dialog open={!!fechaSeleccionada} onClose={() => setFechaSeleccionada(null)} title="Turnos del día" description={fechaDetalle ? formatFecha(fechaDetalle.toISOString()) : undefined} size="sm">
        <div className="space-y-3">
          {turnosSeleccionados.map(turno => <div key={turno.id} className="rounded-lg bg-slate-50 ring-1 ring-inset ring-slate-200 px-3.5 py-3">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sm text-slate-900">Dr. {turno.medico?.nombre} {turno.medico?.apellido}</p><p className="text-[13px] text-slate-500 mt-0.5">{turno.medico?.especialidad.nombre}</p></div><StatusBadge status={turno.status} /></div>
            <p className="flex items-center gap-1.5 text-[13px] text-slate-600 mt-2"><IconClock className="w-3.5 h-3.5" />{turno.hora} hs</p>
            <p className="text-[13px] text-slate-600 mt-1.5"><span className="font-semibold text-slate-700">Motivo:</span> {turno.motivo || 'Sin motivo informado'}</p>
          </div>)}
        </div>
      </Dialog>
    </Card>
  );
}

function DateTile({ fecha }: { fecha: string }) {
  const d = new Date(fecha);
  return (
    <div className="w-12 shrink-0 rounded-lg bg-brand-50 ring-1 ring-inset ring-brand-100 text-center py-1.5">
      <p className="text-lg font-bold leading-tight text-brand-700 tnum">{d.getUTCDate()}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">{MESES[d.getUTCMonth()]}</p>
    </div>
  );
}

function NotaBlock({ label, text, cls }: { label?: string; text: string; cls: string }) {
  return (
    <div className={`mt-2.5 px-3 py-2 rounded-lg text-[13px] leading-relaxed ${cls}`}>
      {label && <span className="font-semibold">{label}: </span>}
      {text}
    </div>
  );
}

function TurnoCard({ t, onCancelar, onReagendar, onCalificar, puedeCalificar }: {
  t: Turno;
  onCancelar?: () => void;
  onReagendar?: () => void;
  onCalificar?: () => void;
  puedeCalificar?: boolean;
}) {
  const cancelable = t.status === 'PENDIENTE' || t.status === 'EN_ESPERA';
  return (
    <motion.div variants={listItem}>
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <DateTile fecha={t.fecha} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  Dr. {t.medico?.nombre} {t.medico?.apellido}
                </p>
                <p className="text-[13px] text-slate-500 mt-0.5">{t.medico?.especialidad.nombre}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {t.esSobreturno && (
                  <span className="inline-flex items-center px-2 py-1 rounded-pill text-xs font-semibold bg-amber-100 text-amber-700 whitespace-nowrap">
                    Sobreturno
                  </span>
                )}
                <StatusBadge status={t.status} />
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-[13px] text-slate-500 mt-2">
              <IconClock className="w-3.5 h-3.5 text-slate-400" />
              {formatFecha(t.fecha)} · {t.hora} hs
            </p>
            {t.status === 'EN_ESPERA' && (
              <p className="text-[12px] text-amber-700 mt-1.5">
                En lista de espera. Si se libera el horario, se te cede automáticamente y te avisamos.
              </p>
            )}
            {t.motivo && <p className="text-[13px] text-slate-500 italic mt-2">“{t.motivo}”</p>}
            {t.notas && <NotaBlock label="Nota" text={t.notas} cls="bg-brand-50 text-brand-800" />}
            {t.diagnostico && <NotaBlock label="Diagnóstico" text={t.diagnostico} cls="bg-success-soft text-success-text" />}
            {t.razonCancelacion && <NotaBlock text={t.razonCancelacion} cls="bg-danger-soft text-danger-text" />}

            {/* Calificación: ya hecha (solo lectura) o invitación a calificar */}
            {t.status === 'COMPLETADO' && t.calificacion && (
              <div className="mt-2.5 px-3 py-2.5 rounded-lg bg-amber-50 ring-1 ring-amber-100">
                <div className="flex items-center gap-2">
                  <Stars value={t.calificacion.estrellas} size={16} />
                  <span className="text-[12px] font-semibold text-amber-700">Tu calificación</span>
                </div>
                {t.calificacion.comentario && (
                  <p className="text-[13px] text-slate-600 mt-1.5 italic">“{t.calificacion.comentario}”</p>
                )}
              </div>
            )}

            {(onCancelar || onReagendar || onCalificar) && (
              <div className="flex gap-2 mt-3">
                {cancelable && onCancelar && (
                  <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger-text" onClick={onCancelar}>
                    {t.status === 'EN_ESPERA' ? 'Cancelar sobreturno' : 'Cancelar turno'}
                  </Button>
                )}
                {(t.status === 'CANCELADO' || t.status === 'AUSENTE') && onReagendar && (
                  <Button variant="secondary" size="sm" onClick={onReagendar}>
                    Reagendar
                  </Button>
                )}
                {t.status === 'COMPLETADO' && !t.calificacion && puedeCalificar && onCalificar && (
                  <Button variant="secondary" size="sm" onClick={onCalificar}>
                    Calificar atención
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Grupo({ titulo, turnos, onCancelar, onReagendar }: {
  titulo: string;
  turnos: Turno[];
  onCancelar: (t: Turno) => void;
  onReagendar: (t: Turno) => void;
}) {
  if (!turnos.length) return null;
  return (
    <div className="mb-7">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">{titulo}</p>
      <div className="space-y-3">
        {turnos.map(t => (
          <TurnoCard key={t.id} t={t} onCancelar={() => onCancelar(t)} onReagendar={() => onReagendar(t)} />
        ))}
      </div>
    </div>
  );
}

export default function PacienteTurnos() {
  const navigate = useNavigate();
  const { data: turnos, isLoading } = useMisTurnos();
  const cancelar = useCancelarTurno();
  const calificar = useCrearCalificacion();
  const puedeCalificar = useAuthStore(s => s.user?.puedeCalificar !== false);

  const [tab, setTab] = useState('proximos');
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null);
  const [razon, setRazon] = useState('');
  const [turnoACalificar, setTurnoACalificar] = useState<Turno | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');

  const proximos = turnos?.filter(t => t.status === 'PENDIENTE' || t.status === 'CONFIRMADO' || t.status === 'EN_ESPERA')
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) ?? [];
  const historial = turnos?.filter(t => t.status === 'COMPLETADO' || t.status === 'CANCELADO' || t.status === 'AUSENTE')
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) ?? [];

  const grupos = groupProximos(proximos);
  const completados = turnos?.filter(t => t.status === 'COMPLETADO').length ?? 0;

  const handleCancelar = async () => {
    if (!turnoACancelar) return;
    try {
      await cancelar.mutateAsync({ id: turnoACancelar.id, razonCancelacion: razon || undefined });
      toast.success('Turno cancelado');
      setTurnoACancelar(null);
      setRazon('');
    } catch {
      toast.error('No se pudo cancelar el turno');
    }
  };

  const abrirCalificar = (t: Turno) => {
    setTurnoACalificar(t);
    setEstrellas(0);
    setComentario('');
  };

  const handleCalificar = async () => {
    if (!turnoACalificar || estrellas < 1) {
      toast.error('Elegí al menos una estrella');
      return;
    }
    try {
      await calificar.mutateAsync({ turnoId: turnoACalificar.id, estrellas, comentario: comentario || undefined });
      toast.success('¡Gracias por tu calificación!');
      setTurnoACalificar(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo enviar la calificación'));
    }
  };

  const handleReagendar = (t: Turno) => {
    if (!t.medico) return;
    navigate(`/paciente/solicitar?prefillEspecialidadId=${t.medico.especialidad.id}&prefillMedicoId=${t.medico.id}`);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Mis turnos"
        description={
          proximos.length > 0
            ? `${proximos.length} ${proximos.length === 1 ? 'turno próximo' : 'turnos próximos'} · ${completados} completados`
            : 'No tenés turnos próximos por ahora.'
        }
        actions={
          <Button iconLeft={<IconPlus />} onClick={() => navigate('/paciente/solicitar')}>
            Solicitar turno
          </Button>
        }
      />

      <CalendarioTurnos turnos={turnos ?? []} />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'proximos', label: 'Próximos', count: proximos.length },
          { id: 'historial', label: 'Historial', count: historial.length },
        ]}
      />

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : tab === 'proximos' ? (
        proximos.length === 0 ? (
          <EmptyState
            icon={<IconCalendar />}
            title="Sin turnos próximos"
            description="Todavía no tenés turnos pendientes ni confirmados. Solicitá el primero en un minuto."
            action={
              <Button iconLeft={<IconPlus />} onClick={() => navigate('/paciente/solicitar')}>
                Solicitar turno
              </Button>
            }
          />
        ) : (
          <motion.div variants={listContainer} initial="hidden" animate="visible">
            <Grupo titulo="Hoy" turnos={grupos.hoy} onCancelar={setTurnoACancelar} onReagendar={handleReagendar} />
            <Grupo titulo="Mañana" turnos={grupos.manana} onCancelar={setTurnoACancelar} onReagendar={handleReagendar} />
            <Grupo titulo="Próximos" turnos={grupos.proximos} onCancelar={setTurnoACancelar} onReagendar={handleReagendar} />
          </motion.div>
        )
      ) : historial.length === 0 ? (
        <EmptyState
          icon={<IconClock />}
          title="Sin historial"
          description="Acá vas a ver tus turnos completados y cancelados."
        />
      ) : (
        <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-3">
          {historial.map(t => (
            <TurnoCard
              key={t.id}
              t={t}
              onReagendar={() => handleReagendar(t)}
              onCalificar={() => abrirCalificar(t)}
              puedeCalificar={puedeCalificar}
            />
          ))}
        </motion.div>
      )}

      <ConfirmDialog
        open={!!turnoACancelar}
        onClose={() => { setTurnoACancelar(null); setRazon(''); }}
        onConfirm={handleCancelar}
        title="Cancelar turno"
        confirmLabel="Cancelar turno"
        cancelLabel="Volver"
        tone="danger"
        loading={cancelar.isPending}
      >
        {turnoACancelar && (
          <div className="space-y-4">
            <div className="px-3.5 py-3 rounded-field bg-slate-50 ring-1 ring-inset ring-slate-200 text-sm">
              <p className="font-semibold text-slate-900">
                Dr. {turnoACancelar.medico?.nombre} {turnoACancelar.medico?.apellido}
              </p>
              <p className="text-[13px] text-slate-500 mt-0.5">
                {formatFecha(turnoACancelar.fecha)} a las {turnoACancelar.hora} hs
              </p>
            </div>
            <Textarea
              label="Motivo"
              hint="Opcional"
              value={razon}
              onChange={e => setRazon(e.target.value)}
              rows={3}
              placeholder="Contanos por qué cancelás…"
            />
          </div>
        )}
      </ConfirmDialog>

      <Dialog
        open={!!turnoACalificar}
        onClose={() => setTurnoACalificar(null)}
        title="Calificar atención"
        description={turnoACalificar
          ? `Dr. ${turnoACalificar.medico?.nombre} ${turnoACalificar.medico?.apellido} · ${formatFecha(turnoACalificar.fecha)}`
          : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTurnoACalificar(null)}>Cancelar</Button>
            <Button onClick={handleCalificar} loading={calificar.isPending} disabled={estrellas < 1}>
              Enviar calificación
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-semibold text-slate-700 mb-2">¿Cómo fue la atención?</p>
            <Stars value={estrellas} onChange={setEstrellas} size={32} />
          </div>
          <Textarea
            label="Comentario"
            hint="Opcional — contanos tu experiencia"
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            rows={3}
            placeholder="Escribí tu opinión…"
          />
        </div>
      </Dialog>
    </PageTransition>
  );
}
