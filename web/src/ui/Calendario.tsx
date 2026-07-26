import { useMemo, useState } from 'react';
import { cn } from '../lib/cn';
import { IconChevronLeft, IconChevronRight } from './icons';
import {
  DIAS_SEMANA, MESES_COMPLETOS, claveDeDia, claveFecha, mismaFecha,
} from '../lib/fechas';

// Calendario mensual que marca los días con turnos. Solo dibuja la grilla y avisa qué día
// se eligió; el detalle del día lo arma cada página, porque el paciente y el médico
// muestran cosas distintas (uno el médico que lo atiende, el otro el paciente que viene).

interface ConFecha { fecha: string }

interface Props<T extends ConFecha> {
  turnos: T[];
  /** Día elegido en formato "YYYY-MM-DD". */
  fechaSeleccionada?: string | null;
  onSeleccionar: (fecha: string) => void;
  /** Si es false, los días sin turnos no se pueden elegir (útil para el paciente). */
  permitirDiasVacios?: boolean;
  className?: string;
}

export function Calendario<T extends ConFecha>({
  turnos, fechaSeleccionada, onSeleccionar, permitirDiasVacios = true, className,
}: Props<T>) {
  const hoy = new Date();

  // El mes visible arranca en el del día elegido, o en el actual
  const [mesVisible, setMesVisible] = useState(() => {
    const base = fechaSeleccionada ? new Date(`${fechaSeleccionada}T12:00:00`) : hoy;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const turnosPorFecha = useMemo(() => {
    return turnos.reduce<Record<string, T[]>>((acumulado, turno) => {
      const fecha = claveFecha(turno.fecha);
      (acumulado[fecha] ??= []).push(turno);
      return acumulado;
    }, {});
  }, [turnos]);

  const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1);
  const ultimoDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0);
  // getDay() devuelve 0 para domingo; corremos el índice para que la semana empiece en lunes
  const espaciosIniciales = (primerDia.getDay() + 6) % 7;
  const dias = Array.from(
    { length: ultimoDia.getDate() },
    (_, i) => new Date(mesVisible.getFullYear(), mesVisible.getMonth(), i + 1),
  );

  const cambiarMes = (delta: number) =>
    setMesVisible(actual => new Date(actual.getFullYear(), actual.getMonth() + delta, 1));

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-slate-900">
          {MESES_COMPLETOS[mesVisible.getMonth()]} {mesVisible.getFullYear()}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button" aria-label="Mes anterior" onClick={() => cambiarMes(-1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button" aria-label="Mes siguiente" onClick={() => cambiarMes(1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <IconChevronRight />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(dia => (
          <span key={dia} className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-1">
            {dia}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: espaciosIniciales }).map((_, i) => <div key={`vacio-${i}`} />)}
        {dias.map(dia => {
          const fecha = claveDeDia(dia);
          const delDia = turnosPorFecha[fecha] ?? [];
          const tieneTurnos = delDia.length > 0;
          const esHoy = mismaFecha(dia, hoy);
          const activo = fechaSeleccionada === fecha;
          const clickeable = tieneTurnos || permitirDiasVacios;

          return (
            <button
              key={fecha}
              type="button"
              disabled={!clickeable}
              aria-pressed={activo}
              aria-label={`${dia.getDate()} de ${MESES_COMPLETOS[dia.getMonth()]}${tieneTurnos ? `, ${delDia.length} turno(s)` : ', sin turnos'}`}
              onClick={() => onSeleccionar(fecha)}
              className={cn(
                'relative aspect-square rounded-lg text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                activo
                  ? 'bg-brand-600 text-white ring-1 ring-inset ring-brand-600'
                  : tieneTurnos
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 hover:bg-brand-100'
                    : clickeable
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-300 cursor-default',
                esHoy && !activo && 'ring-2 ring-inset ring-brand-500',
              )}
            >
              {dia.getDate()}
              {tieneTurnos && (
                <span
                  className={cn(
                    'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                    activo ? 'bg-white' : 'bg-brand-600',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
