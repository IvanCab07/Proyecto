import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMiAgenda, useMisCalificacionesMedico } from '../../hooks';
import { useAuthStore } from '../../store/useAuthStore';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, StatCard, StatusBadge, EmptyState, SkeletonStatCard, SkeletonTable, AlertInline,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import {
  IconCalendar, IconClock, IconCheckCircle, IconPill, IconUsers, IconSparkle, IconArrowRight,
  IconClipboard,
} from '../../ui/icons';
import { claveFecha, hoyISO } from '../../lib/fechas';

const ACCESOS = [
  { label: 'Mi agenda',          desc: 'Calendario de turnos',    icon: <IconCalendar />,  to: '/medico/agenda' },
  { label: 'Administrar turnos', desc: 'Cambiar y corregir estados', icon: <IconClipboard />, to: '/medico/turnos' },
  { label: 'Mis pacientes',      desc: 'Historial, recetas y estudios', icon: <IconUsers />, to: '/medico/pacientes' },
  { label: 'Recetas',            desc: 'Emití y consultá',        icon: <IconPill />,      to: '/medico/recetas' },
  { label: 'Calificaciones',     desc: 'Reseñas recibidas',       icon: <IconSparkle />,   to: '/medico/calificaciones' },
];

export default function MedicoInicio() {
  const { user } = useAuthStore();
  const { data: agenda, isLoading } = useMiAgenda();
  const { data: calif } = useMisCalificacionesMedico();

  const today = hoyISO();
  const { hoy, proximos, completados, enEspera } = useMemo(() => {
    const list = agenda ?? [];
    const activo = (s: string) => s === 'PENDIENTE' || s === 'CONFIRMADO';
    return {
      hoy: list
        .filter(t => claveFecha(t.fecha) === today && activo(t.status))
        .sort((a, b) => a.hora.localeCompare(b.hora)),
      proximos: list.filter(t => claveFecha(t.fecha) > today && activo(t.status)).length,
      completados: list.filter(t => t.status === 'COMPLETADO').length,
      // Sobreturnos en cola: esperan a que se libere un horario y antes no se veían en ningún lado
      enEspera: list.filter(t => t.status === 'EN_ESPERA').length,
    };
  }, [agenda, today]);

  return (
    <PageTransition>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-card gradient-card text-rail-fg p-6 sm:p-7 mb-6">
        <div
          className="absolute -top-24 -right-16 w-80 h-80 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7BDC93, transparent 70%)' }}
        />
        <div className="relative">
          <p className="text-brand-300 text-sm font-medium">Panel del médico</p>
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tighter2 mt-1 leading-tight">Hola, Dr. {user?.apellido}</h1>
          <p className="text-rail-fg/70 text-sm mt-2">
            {hoy.length === 0 ? 'No tenés turnos para hoy.' : `Tenés ${hoy.length} ${hoy.length === 1 ? 'turno' : 'turnos'} para hoy.`}
          </p>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Turnos hoy" value={hoy.length} icon={<IconCalendar />} tone="brand" />
          <StatCard label="Próximos" value={proximos} icon={<IconClock />} tone="default" />
          <StatCard label="Completados" value={completados} icon={<IconCheckCircle />} tone="success" />
          <StatCard
            label="Reseñas"
            value={calif?.cantidad ?? 0}
            icon={<IconSparkle />}
            tone="accent"
            hint={calif?.cantidad ? `Promedio ${calif.promedio.toFixed(1)} ★` : undefined}
          />
        </div>
      )}

      {enEspera > 0 && (
        <Link to="/medico/turnos" className="block mb-6">
          <AlertInline tono="info">
            {enEspera === 1
              ? 'Tenés 1 sobreturno en espera de que se libere un horario.'
              : `Tenés ${enEspera} sobreturnos en espera de que se libere un horario.`}
            {' '}Verlos en Administrar turnos.
          </AlertInline>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Turnos de hoy */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Turnos de hoy</h2>
          </div>
          {isLoading ? (
            <SkeletonTable rows={3} cols={3} />
          ) : hoy.length === 0 ? (
            <EmptyState
              icon={<IconCalendar />}
              title="Sin turnos para hoy"
              description="Cuando tengas turnos para hoy van a aparecer acá."
            />
          ) : (
            <Table>
              <THead>
                <TH>Paciente</TH>
                <TH>Hora</TH>
                <TH>Estado</TH>
              </THead>
              <TBody>
                {hoy.map(t => (
                  <TR key={t.id}>
                    <TD className="font-medium text-slate-900 whitespace-nowrap">
                      {t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '—'}
                    </TD>
                    <TD className="whitespace-nowrap">{t.hora}</TD>
                    <TD><StatusBadge status={t.status} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        {/* Accesos rápidos */}
        <Card className="p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <IconArrowRight className="w-4 h-4 text-slate-400" /> Accesos rápidos
          </h3>
          <div className="grid gap-2.5">
            {ACCESOS.map(a => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-center gap-3 rounded-field ring-1 ring-inset ring-slate-100 hover:ring-brand-200 hover:bg-brand-50/40 px-3.5 py-3 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-colors [&>svg]:w-4 [&>svg]:h-4">
                  {a.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{a.label}</span>
                  <span className="block text-xs text-slate-400 truncate">{a.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
