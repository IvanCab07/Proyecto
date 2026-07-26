import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useMiAgenda } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { CambiarEstadoDialog } from '../../components/medico/CambiarEstadoDialog';
import {
  Card, Button, Calendario, PageHeader, StatusBadge, EmptyState, Skeleton,
} from '../../ui';
import {
  IconCalendar, IconClock, IconArrowUpRight, IconClipboard, IconUser,
} from '../../ui/icons';
import { claveFecha, fechaDeTurno, hoyISO } from '../../lib/fechas';
import { formatFechaLarga } from '../../lib/format';
import { avancesDe, reversionesDe } from '../../lib/turnoEstados';
import { cn } from '../../lib/cn';
import { listContainer, listItem } from '../../lib/motion';
import type { Turno } from '../../services';

// Vista de calendario de la agenda. Para operar sobre muchos turnos a la vez está
// "Administrar turnos", que tiene tabla y filtros.

export default function MedicoAgenda() {
  const { data: turnos, isLoading } = useMiAgenda();
  const navigate = useNavigate();
  const [dia, setDia] = useState(hoyISO);
  const [target, setTarget] = useState<Turno | null>(null);

  const lista = useMemo(() => turnos ?? [], [turnos]);

  // Turnos del día elegido, ordenados por hora. Se muestran TODOS los estados: antes
  // los sobreturnos en espera y los ausentes no aparecían en ningún lado.
  const delDia = useMemo(
    () => lista
      .filter(t => claveFecha(t.fecha) === dia)
      .sort((a, b) => a.hora.localeCompare(b.hora)),
    [lista, dia],
  );

  const resumen = useMemo(() => ({
    total:      delDia.length,
    pendientes: delDia.filter(t => t.status === 'PENDIENTE' || t.status === 'CONFIRMADO').length,
    completados: delDia.filter(t => t.status === 'COMPLETADO').length,
    enEspera:   delDia.filter(t => t.status === 'EN_ESPERA').length,
  }), [delDia]);

  const esHoy = dia === hoyISO();

  return (
    <PageTransition>
      <PageHeader
        title="Mi agenda"
        description="Tus turnos en el calendario. Elegí un día para ver el detalle."
        actions={
          <Button variant="secondary" iconLeft={<IconClipboard />} onClick={() => navigate('/medico/turnos')}>
            Administrar turnos
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr] gap-5">
          <Skeleton className="h-80 rounded-card" />
          <Skeleton className="h-80 rounded-card" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr] gap-5 items-start">
          {/* Calendario */}
          <Card className="p-4 sm:p-5">
            <Calendario turnos={lista} fechaSeleccionada={dia} onSeleccionar={setDia} />
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-[12px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Con turnos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md ring-2 ring-inset ring-brand-500" /> Hoy
              </span>
            </div>
          </Card>

          {/* Turnos del día */}
          <div className="space-y-4">
            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900 capitalize">
                    {formatFechaLarga(fechaDeTurno(dia).toISOString())}
                  </h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    {esHoy ? 'Hoy' : 'Día seleccionado'} · {resumen.total} {resumen.total === 1 ? 'turno' : 'turnos'}
                  </p>
                </div>
                {!esHoy && (
                  <Button variant="ghost" size="sm" onClick={() => setDia(hoyISO())}>
                    Ir a hoy
                  </Button>
                )}
              </div>

              {resumen.total > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <Chip label="Por atender" valor={resumen.pendientes} tono="warning" />
                  <Chip label="Completados" valor={resumen.completados} tono="success" />
                  {resumen.enEspera > 0 && (
                    <Chip label="Sobreturnos en espera" valor={resumen.enEspera} tono="info" />
                  )}
                </div>
              )}
            </Card>

            {delDia.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<IconCalendar />}
                  title="Sin turnos ese día"
                  description="Elegí otro día en el calendario. Los días con turnos están marcados con un punto."
                />
              </Card>
            ) : (
              <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-2.5">
                {delDia.map(t => (
                  <motion.div key={t.id} variants={listItem}>
                    <TurnoCard turno={t} onCambiar={() => setTarget(t)} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}

      <CambiarEstadoDialog turno={target} onClose={() => setTarget(null)} />
    </PageTransition>
  );
}

const TONOS = {
  warning: 'bg-warning-soft text-warning-text',
  success: 'bg-success-soft text-success-text',
  info:    'bg-info-soft text-info-text',
} as const;

function Chip({ label, valor, tono }: { label: string; valor: number; tono: keyof typeof TONOS }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold', TONOS[tono])}>
      <span className="tnum">{valor}</span> {label}
    </span>
  );
}

function TurnoCard({ turno, onCambiar }: { turno: Turno; onCambiar: () => void }) {
  const puedeCambiar = avancesDe(turno.status).length > 0 || reversionesDe(turno.status).length > 0;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start gap-3">
        {/* Hora */}
        <div className="w-16 shrink-0 rounded-lg bg-brand-50 ring-1 ring-inset ring-brand-100 text-center py-2">
          <p className="text-sm font-bold text-brand-700 tnum leading-tight">{turno.hora}</p>
          <p className="text-[10px] text-brand-600/70 uppercase tracking-wider mt-0.5">hs</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              <IconUser className="w-4 h-4 text-slate-400 shrink-0" />
              {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : 'Paciente'}
            </p>
            <StatusBadge status={turno.status} />
            {turno.esSobreturno && (
              <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-amber-700 text-[11px] font-semibold">
                Sobreturno
              </span>
            )}
          </div>

          {turno.paciente?.dni && (
            <p className="text-[12px] text-slate-400 mt-0.5 tnum">DNI {turno.paciente.dni}</p>
          )}
          {turno.motivo && (
            <p className="text-[13px] text-slate-500 italic mt-1.5">“{turno.motivo}”</p>
          )}
          {turno.diagnostico && (
            <p className="text-[13px] mt-2 px-2.5 py-1.5 rounded-lg bg-success-soft text-success-text">
              {turno.diagnostico}
            </p>
          )}
          {turno.razonCancelacion && (
            <p className="text-[13px] mt-2 px-2.5 py-1.5 rounded-lg bg-danger-soft text-danger-text">
              Motivo de cancelación: {turno.razonCancelacion}
            </p>
          )}
        </div>

        {puedeCambiar && (
          <Button variant="ghost" size="sm" iconRight={<IconArrowUpRight />} onClick={onCambiar}>
            Cambiar estado
          </Button>
        )}
      </div>

      {turno.status === 'EN_ESPERA' && (
        <p className="flex items-center gap-1.5 text-[12px] text-info-text mt-3 pt-3 border-t border-slate-100">
          <IconClock className="w-3.5 h-3.5 shrink-0" />
          Sobreturno en cola: se confirma solo si se libera el horario.
        </p>
      )}
    </Card>
  );
}
