import { cn } from '../lib/cn';
import type { Turno } from '../services';

type Status = Turno['status'];

const MAP: Record<Status, { label: string; pill: string; dot: string }> = {
  PENDIENTE:  { label: 'Pendiente',  pill: 'bg-warning-soft text-warning-text', dot: 'bg-warning' },
  CONFIRMADO: { label: 'Confirmado', pill: 'bg-brand-100 text-brand-800',       dot: 'bg-brand-600' },
  COMPLETADO: { label: 'Completado', pill: 'bg-success-soft text-success-text', dot: 'bg-success' },
  CANCELADO:  { label: 'Cancelado',  pill: 'bg-danger-soft text-danger-text',   dot: 'bg-danger' },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const s = MAP[status] ?? MAP.PENDIENTE;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold whitespace-nowrap',
        s.pill,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}
