import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Dialog, Textarea, StatusBadge, AlertInline } from '../../ui';
import { cn } from '../../lib/cn';
import { apiError } from '../../lib/apiError';
import { formatFecha } from '../../lib/format';
import { ACCIONES, ETIQUETAS, avancesDe, reversionesDe } from '../../lib/turnoEstados';
import { useUpdateTurnoStatus } from '../../hooks';
import type { Turno, TurnoStatus } from '../../services';

// Cambio de estado de un turno. Lo usan la agenda y la página de administrar turnos, así que
// las dos ofrecen exactamente las mismas opciones.
//
// Separa "avanzar" (el flujo normal: confirmar, completar, cancelar) de "deshacer" (volver a
// un estado abierto porque se marcó mal). Deshacer pide confirmación explícita y el backend
// además lo rechaza si el paciente ya calificó o si otro turno ocupó el horario.

interface Props {
  turno: Turno | null;
  onClose: () => void;
  /** Estado al que se quiere ir directamente (para el botón "Deshacer" de la tabla). */
  destinoInicial?: TurnoStatus | null;
}

export function CambiarEstadoDialog({ turno, onClose, destinoInicial }: Props) {
  if (!turno) return null;
  // La key remonta el formulario al cambiar de turno, así arranca siempre con sus datos
  return (
    <Formulario
      key={`${turno.id}-${destinoInicial ?? ''}`}
      turno={turno}
      onClose={onClose}
      destinoInicial={destinoInicial}
    />
  );
}

function Formulario({ turno, onClose, destinoInicial }: Props & { turno: Turno }) {
  const update = useUpdateTurnoStatus();

  const [destino, setDestino] = useState<TurnoStatus | ''>(destinoInicial ?? '');
  const [notas, setNotas] = useState(turno.notas ?? '');
  const [diagnostico, setDiagnostico] = useState(turno.diagnostico ?? '');
  const [error, setError] = useState('');

  const avances = avancesDe(turno.status);
  const reversiones = reversionesDe(turno.status);
  const esDeshacer = !!destino && reversiones.includes(destino);

  const elegir = (estado: TurnoStatus) => { setDestino(estado); setError(''); };

  const guardar = async () => {
    if (!destino) return setError('Elegí el nuevo estado');
    setError('');
    try {
      await update.mutateAsync({
        id: turno.id,
        status: destino,
        notas: notas.trim() || undefined,
        diagnostico: diagnostico.trim() || undefined,
      });
      toast.success(esDeshacer ? 'Estado corregido' : 'Turno actualizado');
      onClose();
    } catch (e) {
      setError(apiError(e, 'No se pudo actualizar el turno'));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Cambiar estado del turno"
      description={
        turno.paciente
          ? `${turno.paciente.nombre} ${turno.paciente.apellido} · ${formatFecha(turno.fecha)} ${turno.hora}`
          : `${formatFecha(turno.fecha)} ${turno.hora}`
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            variant={esDeshacer ? 'danger' : 'primary'}
            onClick={guardar}
            loading={update.isPending}
            disabled={!destino}
          >
            {esDeshacer ? 'Sí, deshacer' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          Estado actual: <StatusBadge status={turno.status} />
        </div>

        {avances.length > 0 && (
          <GrupoOpciones titulo="Avanzar" estados={avances} elegido={destino} onElegir={elegir} />
        )}
        {reversiones.length > 0 && (
          <GrupoOpciones
            titulo="Deshacer (corregir un error)"
            estados={reversiones}
            elegido={destino}
            onElegir={elegir}
          />
        )}

        {esDeshacer && (
          <AlertInline tono="warning">
            El turno vuelve a estado {ETIQUETAS[destino as TurnoStatus]} y se le avisa al paciente.
            Las notas y el diagnóstico cargados se conservan.
          </AlertInline>
        )}

        <Textarea
          label="Notas para el paciente"
          hint="Opcional"
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={2}
        />

        {destino === 'COMPLETADO' && (
          <Textarea
            label="Diagnóstico / observaciones"
            hint="Opcional · queda en el historial del paciente"
            value={diagnostico}
            onChange={e => setDiagnostico(e.target.value)}
            rows={3}
          />
        )}

        {error && <AlertInline>{error}</AlertInline>}
      </div>
    </Dialog>
  );
}

interface GrupoProps {
  titulo: string;
  estados: TurnoStatus[];
  elegido: TurnoStatus | '';
  onElegir: (estado: TurnoStatus) => void;
}

function GrupoOpciones({ titulo, estados, elegido, onElegir }: GrupoProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {estados.map(estado => (
          <button
            key={estado}
            type="button"
            aria-pressed={elegido === estado}
            onClick={() => onElegir(estado)}
            className={cn(
              'flex-1 min-w-[8rem] py-2.5 px-3 rounded-field text-sm font-semibold ring-1 ring-inset transition-colors',
              elegido === estado
                ? 'bg-brand-600 text-white ring-brand-600'
                : 'bg-surface text-slate-600 ring-slate-200 hover:ring-brand-300',
            )}
          >
            {ACCIONES[estado]}
          </button>
        ))}
      </div>
    </div>
  );
}
