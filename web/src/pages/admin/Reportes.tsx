import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { motion } from 'motion/react';
import { useAdminStats } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { Card, PageHeader, StatCard, SkeletonStatCard, SkeletonChart, Table, THead, TH, TBody, TR, TD } from '../../ui';
import {
  IconChart, IconCalendar, IconClock, IconCheck, IconX, IconShield,
} from '../../ui/icons';
import { CHART, tooltipStyle, axisTickStyle } from '../../lib/chartTheme';
import { EASE } from '../../lib/motion';

const STATUS_COLORS: Record<string, string> = {
  Pendientes:  CHART.status.PENDIENTE,
  Confirmados: CHART.status.CONFIRMADO,
  Completados: CHART.status.COMPLETADO,
  Cancelados:  CHART.status.CANCELADO,
};

export default function AdminReportes() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Reportes" description="Métricas y distribución de los turnos." />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonChart height={240} />
          <SkeletonChart height={240} />
        </div>
      </PageTransition>
    );
  }
  if (!stats) return null;

  const t = stats.turnos;

  const pieData = [
    { name: 'Pendientes',  value: t.pendientes },
    { name: 'Confirmados', value: t.confirmados },
    { name: 'Completados', value: t.completados },
    { name: 'Cancelados',  value: t.cancelados },
  ].filter(d => d.value > 0);

  const medicosBar = stats.topMedicos.map(m => ({
    nombre: m.nombre.split(',')[0].replace('Dr. ', ''),
    turnos: m.total,
    especialidad: m.especialidad,
  }));

  const statItems = [
    { label: 'Total registrados', value: t.total,       tone: 'default' as const, icon: <IconChart /> },
    { label: 'Este mes',          value: t.mes,         tone: 'brand' as const,   icon: <IconCalendar /> },
    { label: 'Pendientes',        value: t.pendientes,  tone: 'warning' as const, icon: <IconClock /> },
    { label: 'Confirmados',       value: t.confirmados, tone: 'brand' as const,   icon: <IconShield /> },
    { label: 'Completados',       value: t.completados, tone: 'success' as const, icon: <IconCheck /> },
    { label: 'Cancelados',        value: t.cancelados,  tone: 'danger' as const,  icon: <IconX /> },
  ];

  return (
    <PageTransition>
      <PageHeader title="Reportes" description="Métricas y distribución de los turnos." />

      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statItems.map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} icon={s.icon} />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Distribución por estado</h2>
            <p className="text-xs text-slate-400 mb-4">Proporción de turnos según su estado actual</p>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400">Sin turnos registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={62} outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    animationDuration={600}
                  >
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? CHART.axis} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} turnos`, '']} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={v => <span style={{ fontSize: 12, color: '#64748B' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          {medicosBar.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-slate-900 mb-1">Médicos con más turnos</h2>
              <p className="text-xs text-slate-400 mb-5">Cantidad de turnos asignados por médico</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={medicosBar} margin={{ top: 0, right: 20, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'rgb(13 148 136 / 0.06)' }}
                    formatter={(val) => [`${val} turnos`, 'Turnos']}
                  />
                  <Bar dataKey="turnos" fill={CHART.brand} radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={600} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {stats.porEspecialidad.length > 0 && (
          <Card className="overflow-hidden">
            <div className="px-6 pt-5 pb-1">
              <h2 className="font-semibold text-slate-900 mb-1">Por especialidad</h2>
              <p className="text-xs text-slate-400">Médicos y turnos agrupados por especialidad</p>
            </div>
            <div className="pt-3">
              <Table>
                <THead>
                  <TH className="pl-6">Especialidad</TH>
                  <TH align="right">Médicos</TH>
                  <TH align="right">Turnos</TH>
                  <TH className="pr-6">Participación</TH>
                </THead>
                <TBody>
                  {stats.porEspecialidad.map((e, i) => {
                    const max = Math.max(...stats.porEspecialidad.map(x => x.turnos), 1);
                    const pct = Math.round((e.turnos / max) * 100);
                    return (
                      <TR key={e.nombre}>
                        <TD className="pl-6 font-medium text-slate-900">{e.nombre}</TD>
                        <TD numeric>{e.medicos}</TD>
                        <TD numeric className="font-semibold text-slate-900">{e.turnos}</TD>
                        <TD className="w-44 pr-6">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: pct / 100 }}
                                transition={{ duration: 0.6, ease: EASE.outExpo, delay: i * 0.05 }}
                                className="h-full w-full rounded-full bg-brand-600 origin-left"
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-9 text-right tnum">{pct}%</span>
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
