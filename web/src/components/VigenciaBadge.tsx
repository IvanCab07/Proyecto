import { estadoReceta, diasHastaVencer } from '../lib/fechas';
import { formatFecha } from '../lib/format';
import { cn } from '../lib/cn';

// Badge de vigencia de una receta. Lo usan la pantalla del paciente, la del médico y el
// historial del paciente: antes cada una lo dibujaba a su manera y con su propio criterio de
// vencimiento, así que el mismo día una decía "Vencida" y la otra "Vigente".

const TONO = {
  vigente:      'bg-success-soft text-success-text',
  'por-vencer': 'bg-warning-soft text-warning-text',
  vencida:      'bg-danger-soft text-danger-text',
} as const;

/** Texto del badge. "Vence mañana" / "Vence hoy" leen mejor que "Vence en 1 día" / "en 0 días". */
function etiqueta(validoHasta: string): string {
  const estado = estadoReceta(validoHasta);
  if (estado === 'vencida') return `Vencida el ${formatFecha(validoHasta)}`;
  if (estado === 'vigente') return `Vigente hasta el ${formatFecha(validoHasta)}`;

  const dias = diasHastaVencer(validoHasta);
  if (dias <= 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `Vence en ${dias} días`;
}

export function VigenciaBadge({ validoHasta, className }: { validoHasta: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-semibold whitespace-nowrap',
        TONO[estadoReceta(validoHasta)],
        className,
      )}
    >
      {etiqueta(validoHasta)}
    </span>
  );
}
