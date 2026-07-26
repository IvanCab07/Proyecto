import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAdminStats } from '../../hooks';
import { useAuthStore } from '../../store/useAuthStore';
import { PageTransition } from '../../components/PageTransition';
import { TrendChart } from '../../components/TrendChart';
import { Card, StatCard, Button, SkeletonStatCard, SkeletonChart } from '../../ui';
import {
  IconCalendar, IconClock, IconCheck, IconX, IconUsers, IconChart, IconStethoscope, IconGrid,
} from '../../ui/icons';
import { listContainer, listItem, EASE } from '../../lib/motion';
import { useChartTheme } from '../../lib/chartTheme';

export default function AdminDashboard() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminStats();
  const { brand, axis, cursorFill, tooltipStyle, axisTickStyle } = useChartTheme();

  const t = stats?.turnos;

  const cards = [
    { label: 'Total turnos',        value: t?.total ?? 0,                    tone: 'default' as const, icon: <IconCalendar /> },
    { label: 'Pendientes',          value: t?.pendientes ?? 0,               tone: 'warning' as const, icon: <IconClock /> },
    { label: 'Hoy',                 value: t?.hoy ?? 0,                      tone: 'brand' as const,   icon: <IconGrid /> },
    { label: 'Completados',         value: t?.completados ?? 0,              tone: 'success' as const, icon: <IconCheck /> },
    { label: 'Cancelados',          value: t?.cancelados ?? 0,               tone: 'danger' as const,  icon: <IconX /> },
    { label: 'Pacientes',           value: stats?.usuarios.pacientes ?? 0,   tone: 'default' as const, icon: <IconUsers /> },
    { label: 'Este mes',            value: t?.mes ?? 0,                      tone: 'default' as const, icon: <IconChart /> },
    { label: 'Médicos disponibles', value: stats?.medicos.disponibles ?? 0,  tone: 'default' as const, icon: <IconStethoscope /> },
  ];

  return (
    <PageTransition>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-card gradient-card text-rail-fg p-6 sm:p-7 mb-6">
        <div
          className="absolute -top-24 -right-16 w-80 h-80 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7BDC93, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-brand-300 text-sm font-medium">Panel de administración</p>
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tighter2 mt-1 leading-tight">Hola, {user?.nombre}</h1>
            <p className="text-rail-fg/70 text-sm mt-2">Resumen general de la actividad.</p>
          </div>
          <Button onClick={() => navigate('/admin/usuarios')} iconLeft={<IconUsers />} className="!bg-white !text-rail hover:!bg-white/90 shadow-btn">
            Gestionar usuarios
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
          <SkeletonChart height={220} />
        ) : stats ? (
          <TrendChart tendencia={stats.tendencia} title="Turnos creados" />
        ) : null}

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
                        tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} />
                      <Bar dataKey="turnos" name="Turnos" fill={brand} radius={[0, 6, 6, 0]} animationDuration={600} />
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
