import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { useMisTurnos, useMisRecetas, useMisEstudios } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { Card, Button, StatusBadge, Spinner } from '../../ui';
import {
  IconPlus, IconCalendar, IconClock, IconPill, IconFolder, IconArrowRight,
  IconCheckCircle, IconStethoscope, IconChevronRight, IconMapPin,
} from '../../ui/icons';
import { listContainer, listItem } from '../../lib/motion';
import { formatFecha, formatFechaLarga } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { Turno } from '../../services';

function saludo(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function NextTurnoCard({ t }: { t: Turno }) {
  const d = new Date(t.fecha);
  return (
    <Card className="overflow-hidden">
      <div className="bg-brand-grad text-white px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-semibold">Tu próximo turno</span>
        <StatusBadge status={t.status} className="!bg-white/15 !text-white" />
      </div>
      <div className="p-5 flex items-start gap-4">
        <div className="w-16 shrink-0 rounded-xl bg-brand-50 ring-1 ring-inset ring-brand-100 text-center py-2">
          <p className="text-2xl font-bold leading-none text-brand-700 tnum">{d.getUTCDate()}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mt-0.5">{MESES[d.getUTCMonth()]}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">Dr. {t.medico.nombre} {t.medico.apellido}</p>
          <p className="text-sm text-slate-500">{t.medico.especialidad.nombre}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[13px] text-slate-600">
            <span className="flex items-center gap-1.5"><IconCalendar className="w-4 h-4 text-slate-400" /> {formatFecha(t.fecha)}</span>
            <span className="flex items-center gap-1.5"><IconClock className="w-4 h-4 text-slate-400" /> {t.hora} hs</span>
          </div>
          {t.motivo && <p className="text-[13px] text-slate-500 italic mt-2">“{t.motivo}”</p>}
        </div>
      </div>
    </Card>
  );
}

export default function PacienteInicio() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const { data: turnos, isLoading } = useMisTurnos();
  const { data: recetas } = useMisRecetas();
  const { data: estudios } = useMisEstudios();

  const today = new Date().toISOString().slice(0, 10);
  const proximos = (turnos ?? [])
    .filter(t => t.fecha.slice(0, 10) >= today && (t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const next = proximos[0];
  const completados = (turnos ?? []).filter(t => t.status === 'COMPLETADO').length;

  const stats = [
    { label: 'Turnos próximos', value: proximos.length, icon: <IconCalendar />, to: '/paciente/turnos', tone: 'brand' as const },
    { label: 'Recetas',         value: recetas?.length ?? 0, icon: <IconPill />, to: '/paciente/recetas', tone: 'success' as const },
    { label: 'Estudios',        value: estudios?.length ?? 0, icon: <IconFolder />, to: '/paciente/estudios', tone: 'info' as const },
    { label: 'Completados',     value: completados, icon: <IconCheckCircle />, to: '/paciente/turnos', tone: 'warning' as const },
  ];

  const TONE: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-700',
    success: 'bg-success-soft text-success-text',
    info: 'bg-info-soft text-info-text',
    warning: 'bg-warning-soft text-warning-text',
  };

  const acciones = [
    { label: 'Solicitar turno', desc: 'Reservá con un médico', icon: <IconPlus />, to: '/paciente/solicitar' },
    { label: 'Mis turnos',      desc: 'Próximos e historial',  icon: <IconCalendar />, to: '/paciente/turnos' },
    { label: 'Recetas',         desc: 'Tus indicaciones',      icon: <IconPill />, to: '/paciente/recetas' },
    { label: 'Estudios',        desc: 'Subí y consultá',       icon: <IconFolder />, to: '/paciente/estudios' },
    { label: 'Centros y mapa',  desc: 'Cómo llegar',           icon: <IconMapPin />, to: '/paciente/mapa' },
  ];

  const ultimasRecetas = (recetas ?? []).slice(0, 3);
  const ultimosEstudios = (estudios ?? []).slice(0, 3);

  return (
    <PageTransition>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-card bg-rail bg-gradient-to-br from-[#0C2422] via-rail to-[#0A1615] text-white p-6 sm:p-8 mb-6">
        <div
          className="absolute -top-24 -right-16 w-80 h-80 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #14B8A6, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-brand-300 text-sm font-medium">{saludo()},</p>
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tighter2 mt-1 leading-tight">
              {user?.nombre} {user?.apellido}
            </h1>
            <p className="text-slate-300 text-sm mt-2 capitalize">{formatFechaLarga(new Date().toISOString())}</p>
          </div>
          <Button
            onClick={() => navigate('/paciente/solicitar')}
            iconLeft={<IconPlus />}
            className="!bg-white !text-rail hover:!bg-brand-50 shadow-btn"
          >
            Solicitar turno
          </Button>
        </div>
      </div>

      {/* Stats */}
      <motion.div variants={listContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <motion.div key={s.label} variants={listItem}>
            <Link to={s.to} className="block">
              <Card className="p-5 transition-transform duration-200 hover:-translate-y-0.5">
                <div className={cn('w-10 h-10 rounded-xl grid place-items-center mb-3 [&>svg]:w-5 [&>svg]:h-5', TONE[s.tone])}>
                  {s.icon}
                </div>
                <p className="text-[28px] leading-none font-bold tracking-tighter2 text-slate-900 tnum">{s.value}</p>
                <p className="text-[13px] text-slate-500 mt-1.5">{s.label}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Próximo turno</h2>
              <Link to="/paciente/turnos" className="text-[13px] font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
                Ver todos <IconChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {isLoading ? (
              <Card className="p-10 grid place-items-center"><Spinner className="text-brand-500" size={22} /></Card>
            ) : next ? (
              <NextTurnoCard t={next} />
            ) : (
              <Card className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 grid place-items-center mx-auto mb-3 [&>svg]:w-6 [&>svg]:h-6">
                  <IconCalendar />
                </div>
                <p className="font-semibold text-slate-900">No tenés turnos próximos</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Reservá uno en menos de un minuto.</p>
                <Button iconLeft={<IconPlus />} onClick={() => navigate('/paciente/solicitar')}>Solicitar turno</Button>
              </Card>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Accesos rápidos</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {acciones.map(a => (
                <Link key={a.label} to={a.to} className="group block">
                  <Card className="p-4 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-colors [&>svg]:w-5 [&>svg]:h-5">
                      {a.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm">{a.label}</p>
                      <p className="text-[13px] text-slate-500">{a.desc}</p>
                    </div>
                    <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Recetas recientes</h2>
              <Link to="/paciente/recetas" className="text-[13px] font-semibold text-brand-700 hover:text-brand-800">Ver</Link>
            </div>
            {ultimasRecetas.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">Todavía no tenés recetas.</p>
            ) : (
              <ul className="space-y-3">
                {ultimasRecetas.map(r => (
                  <li key={r.id} className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-lg bg-success-soft text-success-text grid place-items-center shrink-0 [&>svg]:w-4 [&>svg]:h-4"><IconPill /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{r.medicamento}</p>
                      <p className="text-xs text-slate-400 truncate">{r.dosis} · {formatFecha(r.fechaEmision)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Estudios recientes</h2>
              <Link to="/paciente/estudios" className="text-[13px] font-semibold text-brand-700 hover:text-brand-800">Ver</Link>
            </div>
            {ultimosEstudios.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">Todavía no subiste estudios.</p>
            ) : (
              <ul className="space-y-3">
                {ultimosEstudios.map(e => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-lg bg-info-soft text-info-text grid place-items-center shrink-0 [&>svg]:w-4 [&>svg]:h-4"><IconFolder /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{e.titulo}</p>
                      <p className="text-xs text-slate-400 truncate">{formatFecha(e.fecha)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 bg-brand-50 ring-1 ring-brand-100">
            <span className="w-9 h-9 rounded-lg bg-brand-600 text-white grid place-items-center mb-3 [&>svg]:w-5 [&>svg]:h-5"><IconStethoscope /></span>
            <p className="text-sm font-semibold text-brand-900">¿Necesitás atención?</p>
            <p className="text-[13px] text-brand-800/80 mt-1 mb-3">Elegí especialidad, médico y horario en pocos pasos.</p>
            <Button size="sm" onClick={() => navigate('/paciente/solicitar')} iconRight={<IconArrowRight />}>Reservar ahora</Button>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
