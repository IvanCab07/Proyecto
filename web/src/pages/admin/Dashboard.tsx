import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAdminStats } from '../../hooks';
import { useAuthStore } from '../../store/useAuthStore';
import { PageTransition } from '../../components/PageTransition';
import { Card, StatCard, Button, SkeletonStatCard, SkeletonChart } from '../../ui';
import {
  IconCalendar, IconClock, IconCheck, IconX, IconUsers, IconChart, IconStethoscope, IconGrid, IconCalendarDays,
} from '../../ui/icons';
import { listContainer, listItem, EASE } from '../../lib/motion';
import { CHART, tooltipStyle, axisTickStyle } from '../../lib/chartTheme';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
const DIST = [0.08, 0.11, 0.15, 0.18, 0.22, 0.26];

function buildMonthly(total: number, completados: number) {
  return MONTHS.map((mes, i) => ({
    mes,
    turnos:      Math.round(total * DIST[i]),
    completados: Math.round(completados * DIST[i]),
  }));
}

export default function AdminDashboard() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminStats();

  const t = stats?.turnos;
  const monthly = buildMonthly(t?.total ?? 0, t?.completados ?? 0);

  const cards = [
    { label: 'Total turnos',        value: t?.total ?? 0,                    tone: 'default' as const, icon: <IconCalendar /> },
    { label: 'Pendientes',          value: t?.pendientes ?? 0,               tone: 'warning' as const, icon: <IconClock /> },
    { label: 'Hoy',                 value: t?.hoy ?? 0,                      tone: 'brand' as const,   icon: <IconGrid /> },
    { label: 'Completados',         value: t?.completados ?? 0,              tone: 'success' as const, icon: <IconCheck /> },
    { label: 'Cancelados',          value: t?.cancelados ?? 0,               tone: 'danger' as const,  icon: <IconX /> },
    { label: 'Pacientes',           value: stats?.usuarios.pacientes ?? 0,   tone: 'default' as const, icon: <IconUsers /> },
    { label: 'Este mes',            value: t?.mes ?? 0,                      tone: 'brand' as const,   icon: <IconChart /> },
    { label: 'Médicos disponibles', value: stats?.medicos.disponibles ?? 0,  tone: 'success' as const, icon: <IconStethoscope /> },
  ];

  return (
    <PageTransition>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-card bg-rail bg-gradient-to-br from-[#0C2422] via-rail to-[#0A1615] text-white p-6 sm:p-7 mb-6">
        <div
          className="absolute -top-24 -right-16 w-80 h-80 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #14B8A6, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-brand-300 text-sm font-medium">Panel de administración</p>
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tighter2 mt-1 leading-tight">Hola, {user?.nombre}</h1>
            <p className="text-slate-300 text-sm mt-2">Esto es lo que está pasando en el hospital.</p>
          </div>
          <Button onClick={() => navigate('/admin/agenda')} iconLeft={<IconCalendarDays />} className="!bg-white !text-rail hover:!bg-brand-50 shadow-btn">
            Ver agenda
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {cards.map(s => (
              <motion.div key={s.label} variants={listItem}>
                <StatCard label={s.label} value={s.value} tone={s.tone} icon={s.icon} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {isLoading ? (
          <SkeletonChart height={200} />
        ) : (
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-semibold text-slate-900">Evolución de turnos</h2>
                <p className="text-xs text-slate-400 mt-0.5">Distribución estimada de los últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: CHART.brand }} />
                  Turnos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: CHART.series[1] }} />
                  Completados
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTurnos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.brand} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART.brand} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.series[1]} stopOpacity={0.16} />
                    <stop offset="95%" stopColor={CHART.series[1]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="mes" tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
                <Area type="monotone" dataKey="turnos" name="Turnos" stroke={CHART.brand} strokeWidth={2}
                  fill="url(#gradTurnos)" dot={false} activeDot={{ r: 4, fill: CHART.brand }} animationDuration={600} />
                <Area type="monotone" dataKey="completados" name="Completados" stroke={CHART.series[1]} strokeWidth={2}
                  fill="url(#gradComp)" dot={false} activeDot={{ r: 4, fill: CHART.series[1] }} animationDuration={600} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <SkeletonChart height={180} />
              <SkeletonChart height={180} />
            </>
          ) : (
            <>
              <Card className="p-6">
                <h2 className="font-semibold text-slate-900 mb-5">Turnos por especialidad</h2>
                {(stats?.porEspecialidad?.length ?? 0) === 0 ? (
                  <p className="text-sm text-slate-400">Sin datos todavía.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={stats!.porEspecialidad}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" tick={axisTickStyle} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="nombre" width={96}
                        tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(13 148 136 / 0.06)' }} />
                      <Bar dataKey="turnos" name="Turnos" fill={CHART.brand} radius={[0, 6, 6, 0]} animationDuration={600} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="font-semibold text-slate-900 mb-5">Médicos más solicitados</h2>
                {!stats?.topMedicos?.length ? (
                  <p className="text-sm text-slate-400">Sin datos todavía.</p>
                ) : (
                  <div className="space-y-4">
                    {stats.topMedicos.map((m, i) => {
                      const max = Math.max(...stats.topMedicos.map(x => x.total), 1);
                      return (
                        <div key={`${m.nombre}-${i}`}>
                          <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 grid place-items-center text-[11px] font-semibold shrink-0 tnum">
                                {i + 1}
                              </span>
                              <span className="font-medium text-slate-800 truncate">{m.nombre}</span>
                              <span className="text-xs text-slate-400 truncate hidden sm:inline">{m.especialidad}</span>
                            </div>
                            <span className="text-[13px] font-semibold text-slate-900 tnum whitespace-nowrap">{m.total}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: m.total / max }}
                              transition={{ duration: 0.6, ease: EASE.outExpo, delay: i * 0.06 }}
                              className="h-full w-full rounded-full bg-brand-600 origin-left"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
