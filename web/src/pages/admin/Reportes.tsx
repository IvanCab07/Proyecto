import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { useAdminStats } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { TrendChart } from '../../components/TrendChart';
import { Card, PageHeader, SkeletonChart, Table, THead, TH, TBody, TR, TD } from '../../ui';
import { useChartTheme } from '../../lib/chartTheme';
import { EASE } from '../../lib/motion';

export default function AdminReportes() {
  const { data: stats, isLoading } = useAdminStats();
  const { status, tooltipStyle } = useChartTheme();

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Reportes" description="Métricas y actividad de los turnos." />
        <div className="space-y-6">
          <SkeletonChart height={96} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><SkeletonChart height={280} /></div>
            <SkeletonChart height={280} />
          </div>
        </div>
      </PageTransition>
    );
  }
  if (!stats) return null;

  const t = stats.turnos;
  const pct = (n: number) => (t.total ? Math.round((n / t.total) * 100) : 0);

  const kpis = [
    { label: 'Turnos totales', value: t.total.toLocaleString('es-AR'), sub: `${t.mes} este mes`, tone: 'text-slate-900' },
    { label: 'Compleción',     value: `${pct(t.completados)}%`, sub: `${t.completados} completados`, tone: 'text-success-text' },
    { label: 'Cancelación',    value: `${pct(t.cancelados)}%`, sub: `${t.cancelados} cancelados`, tone: pct(t.cancelados) > 25 ? 'text-danger-text' : 'text-slate-900' },
    { label: 'Ausentismo',     value: `${pct(t.ausentes)}%`, sub: `${t.ausentes} ausentes`, tone: pct(t.ausentes) > 15 ? 'text-warning-text' : 'text-slate-900' },
    { label: 'Médicos activos', value: stats.medicos.disponibles, sub: `${stats.usuarios.pacientes} pacientes`, tone: 'text-slate-900' },
  ];

  const estados = [
    { name: 'Completados', value: t.completados, color: status.COMPLETADO },
    { name: 'Confirmados', value: t.confirmados, color: status.CONFIRMADO },
    { name: 'Pendientes',  value: t.pendientes,  color: status.PENDIENTE },
    { name: 'Cancelados',  value: t.cancelados,  color: status.CANCELADO },
  ].map(e => ({ ...e, pct: pct(e.value) }));
  const pieData = estados.filter(e => e.value > 0);

  const maxMedico = Math.max(...stats.topMedicos.map(m => m.total), 1);

  return (
    <PageTransition>
      <PageHeader title="Reportes" description="Métricas y actividad de los turnos." />

      <div className="space-y-6">
        {/* KPIs */}
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100">
            {kpis.map(k => (
              <div key={k.label} className="px-5 py-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{k.label}</p>
                <p className={`text-[26px] font-bold tracking-tighter2 leading-none mt-2 tnum ${k.tone}`}>{k.value}</p>
                <p className="text-xs text-slate-400 mt-1.5">{k.sub}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Tendencia + estado */}
        <div className="grid gap-6 lg:grid-cols-3">
          <TrendChart className="lg:col-span-2" tendencia={stats.tendencia} title="Turnos creados" />

          <Card className="p-5 lg:p-6">
            <h2 className="font-semibold text-slate-900">Estado de turnos</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">Distribución actual</p>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Sin turnos registrados.</p>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={176}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={56} outerRadius={80}
                        paddingAngle={3} dataKey="value" stroke="none"
                        animationDuration={600}
                      >
                        {pieData.map(e => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} turnos`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900 tnum leading-none">{t.total}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">turnos</span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {estados.map(e => (
                    <li key={e.name} className="flex items-center gap-2.5 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                      <span className="text-slate-600 flex-1">{e.name}</span>
                      <span className="font-semibold text-slate-900 tnum">{e.value}</span>
                      <span className="text-slate-400 w-10 text-right tnum">{e.pct}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        {/* Top médicos + especialidades */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:p-6 lg:col-span-1">
            <h2 className="font-semibold text-slate-900">Médicos con más turnos</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Top {stats.topMedicos.length} por volumen</p>
            {stats.topMedicos.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos todavía.</p>
            ) : (
              <div className="space-y-4">
                {stats.topMedicos.map((m, i) => (
                  <div key={`${m.nombre}-${i}`}>
                    <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 grid place-items-center text-[11px] font-bold shrink-0 tnum">
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-800 truncate">{m.nombre.replace('Dr. ', '')}</span>
                        <span className="text-xs text-slate-400 truncate hidden sm:inline">{m.especialidad}</span>
                      </div>
                      <span className="font-semibold text-slate-900 tnum whitespace-nowrap">{m.total}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: m.total / maxMedico }}
                        transition={{ duration: 0.6, ease: EASE.outExpo, delay: i * 0.05 }}
                        className="h-full w-full rounded-full bg-brand-600 origin-left"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="overflow-hidden lg:col-span-2">
            <div className="px-6 pt-5 pb-1">
              <h2 className="font-semibold text-slate-900">Por especialidad</h2>
              <p className="text-xs text-slate-400 mt-0.5">Médicos y turnos agrupados por especialidad</p>
            </div>
            {stats.porEspecialidad.length === 0 ? (
              <p className="text-sm text-slate-400 px-6 py-8">Sin especialidades cargadas.</p>
            ) : (
              <div className="pt-3">
                <Table>
                  <THead>
                    <TH className="pl-6">Especialidad</TH>
                    <TH align="right">Médicos</TH>
                    <TH align="right">Turnos</TH>
                    <TH className="pr-6">Participación</TH>
                  </THead>
                  <TBody>
                    {[...stats.porEspecialidad].sort((a, b) => b.turnos - a.turnos).map((e, i, arr) => {
                      const max = Math.max(...arr.map(x => x.turnos), 1);
                      const part = Math.round((e.turnos / max) * 100);
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
                                  animate={{ scaleX: part / 100 }}
                                  transition={{ duration: 0.6, ease: EASE.outExpo, delay: i * 0.05 }}
                                  className="h-full w-full rounded-full bg-brand-600 origin-left"
                                />
                              </div>
                              <span className="text-xs text-slate-400 w-9 text-right tnum">{part}%</span>
                            </div>
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
