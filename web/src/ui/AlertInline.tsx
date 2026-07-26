import { cn } from '../lib/cn';
import { IconAlert, IconInfo, IconCheck } from './icons';

// Aviso dentro de un formulario o una tarjeta. Es el bloque que antes estaba copiado
// a mano en cada modal: unificarlo evita que cada pantalla lo escriba distinto.

type Tono = 'danger' | 'warning' | 'info' | 'success';

const ESTILOS: Record<Tono, string> = {
  danger:  'bg-danger-soft text-danger-text',
  warning: 'bg-warning-soft text-warning-text',
  info:    'bg-info-soft text-info-text',
  success: 'bg-success-soft text-success-text',
};

const ICONOS: Record<Tono, typeof IconAlert> = {
  danger:  IconAlert,
  warning: IconAlert,
  info:    IconInfo,
  success: IconCheck,
};

interface Props {
  children: React.ReactNode;
  tono?: Tono;
  className?: string;
}

export function AlertInline({ children, tono = 'danger', className }: Props) {
  const Icono = ICONOS[tono];
  return (
    <div
      role={tono === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-center gap-2.5 rounded-field px-3.5 py-3 text-[13px] font-medium',
        ESTILOS[tono],
        className,
      )}
    >
      <Icono className="shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
