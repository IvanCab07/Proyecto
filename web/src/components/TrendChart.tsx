import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui';
import { cn } from '../lib/cn';
import { CHART, tooltipStyle, axisTickStyle } from '../lib/chartTheme';
import type { TrendPoint } from '../services';

const PERIODOS = [
  { id: 'dias' as const, label: '14 días' },
  { id: 'meses' as const, label: '6 meses' },
];

interface TrendChartProps {
  tendencia: { dias: TrendPoint[]; meses: TrendPoint[] };
  title?: string;
  height?: number;
  className?: string;
}

// Gráfico de turnos creados por período, con datos reales que llegan del backend.
export function TrendChart({ tendencia, title = 'Turnos creados', height = 220, className }: TrendChartProps) {
  const [periodo, setPeriodo] = useState<'dias' | 'meses'>('dias');
  const data = periodo === 'dias' ? tendencia.dias : tendencia.meses;
  const totalPeriodo = data.reduce((acc, d) => acc + d.total, 0);
  const pico = Math.max(...data.map(d => d.total), 0);

  return (
    <Card className={cn('p-5 lg:p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalPeriodo} {totalPeriodo === 1 ? 'turno' : 'turnos'} en {periodo === 'dias' ? 'los últimos 14 días' : 'los últimos 6 meses'} · pico {pico}
          </p>
        </div>
        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 text-[13px] font-semibold shrink-0">
          {PERIODOS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodo(p.id)}
              className={cn(
                'px-3 py-1 rounded-md transition-colors',
                periodo === p.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.16} />
              <stop offset="100%" stopColor={CHART.brand} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={axisTickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
          <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} formatter={(val) => [`${val} turnos`, '']} />
          <Area
            type="monotone"
            dataKey="total"
            stroke={CHART.brand}
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 4, fill: CHART.brand }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
