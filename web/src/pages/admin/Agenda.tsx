import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAllTurnos } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { Card, Button, StatusBadge, Spinner, Avatar } from '../../ui';
import { IconChevronLeft, IconChevronRight, IconClock, IconCalendar } from '../../ui/icons';
import { listContainer, listItem } from '../../lib/motion';
import { formatFecha } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { Turno } from '../../services';

const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOT: Record<string, string> = {
  PENDIENTE: 'bg-warning', CONFIRMADO: 'bg-brand-500', COMPLETADO: 'bg-success', CANCELADO: 'bg-danger',
};
const LEYENDA = [
  { label: 'Pendiente', cls: 'bg-warning' },
  { label: 'Confirmado', cls: 'bg-brand-500' },
  { label: 'Completado', cls: 'bg-success' },
  { label: 'Cancelado', cls: 'bg-danger' },
];

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function AdminAgenda() {
  const { data: turnos, isLoading } = useAllTurnos();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getUTCFullYear(), m: now.getUTCMonth() });
  const todayStr = ymd(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const [selected, setSelected] = useState<string>(todayStr);

  const byDay = useMemo(() => {
    const map = new Map<string, Turno[]>();
    for (const t of turnos ?? []) {
      const key = t.fecha.slice(0, 10);
      const arr = map.get(key);
      if (arr) arr.push(t);
      else map.set(key, [t]);
    }
    return map;
  }, [turnos]);

  const firstWeekday = (new Date(Date.UTC(cursor.y, cursor.m, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => setCursor(c => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const next = () => setCursor(c => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));
  const goToday = () => { setCursor({ y: now.getUTCFullYear(), m: now.getUTCMonth() }); setSelected(todayStr); };

  const selectedTurnos = (byDay.get(selected) ?? []).slice().sort((a, b) => (a.hora < b.hora ? -1 : 1));
  let totalMes = 0;
  for (let d = 1; d <= daysInMonth; d++) totalMes += byDay.get(ymd(cursor.y, cursor.m, d))?.length ?? 0;

  return (
    <PageTransition>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 mb-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-tighter2 text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalMes} {totalMes === 1 ? 'turno' : 'turnos'} en {MESES[cursor.m]} {cursor.y}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={goToday}>Hoy</Button>
          <div className="flex items-center bg-surface rounded-field ring-1 ring-inset ring-slate-200 shadow-xs">
            <button onClick={prev} aria-label="Mes anterior" className="p-2 text-slate-500 hover:text-slate-900 transition-colors"><IconChevronLeft className="w-4 h-4" /></button>
            <span className="px-2 text-sm font-semibold text-slate-700 min-w-[120px] text-center capitalize">{MESES[cursor.m]} {cursor.y}</span>
            <button onClick={next} aria-label="Mes siguiente" className="p-2 text-slate-500 hover:text-slate-900 transition-colors"><IconChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-16 grid place-items-center"><Spinner className="text-brand-500" size={24} /></Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <Card className="lg:col-span-2 p-4 sm:p-5">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DOW.map(d => (
                <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`b-${i}`} />;
                const dateStr = ymd(cursor.y, cursor.m, day);
                const dayTurnos = byDay.get(dateStr) ?? [];
                const isToday = dateStr === todayStr;
                const isSel = dateStr === selected;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelected(dateStr)}
                    className={cn(
                      'relative h-16 sm:h-20 rounded-lg p-1.5 flex flex-col items-start gap-1 ring-1 ring-inset transition-colors text-left',
                      isSel ? 'bg-brand-50 ring-brand-400' : 'ring-slate-100 hover:bg-slate-50',
                    )}
                  >
                    <span className={cn(
                      'text-[13px] font-semibold tnum w-6 h-6 grid place-items-center rounded-full',
                      isToday ? 'bg-brand-600 text-white' : 'text-slate-600',
                    )}>
                      {day}
                    </span>
                    {dayTurnos.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 px-0.5">
                        {dayTurnos.slice(0, 4).map(t => (
                          <span key={t.id} className={cn('w-1.5 h-1.5 rounded-full', DOT[t.status])} />
                        ))}
                        {dayTurnos.length > 4 && <span className="text-[10px] text-slate-400 leading-none">+{dayTurnos.length - 4}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-slate-100">
              {LEYENDA.map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={cn('w-2 h-2 rounded-full', l.cls)} />{l.label}
                </span>
              ))}
            </div>
          </Card>

          {/* Día seleccionado */}
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 capitalize">{formatFecha(selected)}</h2>
            <p className="text-xs text-slate-400 mb-4">
              {selectedTurnos.length} {selectedTurnos.length === 1 ? 'turno' : 'turnos'}
            </p>

            {selectedTurnos.length === 0 ? (
              <div className="flex flex-col items-center text-center py-10">
                <span className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mb-3 [&>svg]:w-5 [&>svg]:h-5"><IconCalendar /></span>
                <p className="text-sm font-medium text-slate-700">Sin turnos este día</p>
                <p className="text-xs text-slate-400 mt-0.5">Elegí otro día en el calendario.</p>
              </div>
            ) : (
              <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {selectedTurnos.map(t => (
                  <motion.div key={t.id} variants={listItem} className="rounded-field ring-1 ring-inset ring-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 tnum">
                        <IconClock className="w-3.5 h-3.5 text-slate-400" />{t.hora} hs
                      </span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" nombre={t.paciente?.nombre} apellido={t.paciente?.apellido} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : 'Paciente'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">Dr. {t.medico.apellido} · {t.medico.especialidad.nombre}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
