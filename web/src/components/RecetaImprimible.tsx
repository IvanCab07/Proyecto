import { LogoBadge, MARCA } from '../ui/Logo';
import { formatFechaLarga } from '../lib/format';
import { estaVencida } from '../lib/fechas';
import type { Receta } from '../services';

// Versión en papel de una receta. Va dentro del <Dialog> de "Mis recetas" y es lo único que
// queda visible al imprimir: las reglas `@media print` de index.css esconden el resto de la
// página y este bloque queda marcado con `data-print-area`.

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm text-slate-900 mt-0.5">{children}</p>
    </div>
  );
}

export function RecetaImprimible({ receta }: { receta: Receta }) {
  const vencida = estaVencida(receta.validoHasta);

  return (
    <div data-print-area className="bg-surface text-slate-900">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <LogoBadge size="sm" />
          <div>
            <p className="font-bold tracking-tightish">{MARCA}</p>
            <p className="text-xs text-slate-500">Receta médica</p>
          </div>
        </div>
        {vencida && (
          <span className="rounded-pill bg-danger-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-danger-text">
            Vencida
          </span>
        )}
      </header>

      <div className="py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Medicamento</p>
        <p className="text-xl font-bold tracking-tightish leading-tight">{receta.medicamento}</p>
        <p className="text-sm font-medium text-brand-700 mt-1">{receta.dosis}</p>

        <div className="mt-5 rounded-field bg-canvas ring-1 ring-inset ring-slate-200 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Indicaciones</p>
          <p className="text-sm leading-relaxed mt-1">{receta.indicacion}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5">
          <Dato label="Fecha de emisión">{formatFechaLarga(receta.fechaEmision)}</Dato>
          <Dato label="Válida hasta">{formatFechaLarga(receta.validoHasta)}</Dato>
        </div>
      </div>

      <footer className="border-t border-slate-200 pt-4">
        <Dato label="Profesional">
          Dr. {receta.medico?.nombre} {receta.medico?.apellido}
          {receta.medico?.matricula && (
            <span className="text-slate-500"> · Matrícula {receta.medico.matricula}</span>
          )}
        </Dato>
        <p className="text-xs text-slate-400 mt-1">{receta.medico?.especialidad?.nombre}</p>
      </footer>
    </div>
  );
}
