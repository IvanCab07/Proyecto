import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMiAgenda } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { CambiarEstadoDialog } from '../../components/medico/CambiarEstadoDialog';
import {
  Card, Button, Select, SearchInput, PageHeader, StatusBadge, EmptyState, SkeletonTable,
  AlertInline, Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconCalendar, IconClipboard, IconX } from '../../ui/icons';
import { formatFecha } from '../../lib/format';
import { claveDeDia, claveFecha, hoyISO } from '../../lib/fechas';
import { normalizar } from '../../lib/validaciones';
import { ACCIONES, avancesDe, reversionesDe } from '../../lib/turnoEstados';
import type { Turno, TurnoStatus } from '../../services';

// Gestión de turnos: buscar, filtrar y corregir estados. La vista de calendario está
// en "Mi agenda"; acá el foco es operar sobre la lista completa.

const ESTADOS: { value: TurnoStatus | ''; label: string }[] = [
  { value: '',           label: 'Todos los estados' },
  { value: 'PENDIENTE',  label: 'Pendientes' },
  { value: 'CONFIRMADO', label: 'Confirmados' },
  { value: 'EN_ESPERA',  label: 'En espera (sobreturnos)' },
  { value: 'COMPLETADO', label: 'Completados' },
  { value: 'CANCELADO',  label: 'Cancelados' },
  { value: 'AUSENTE',    label: 'Ausentes' },
];

type Periodo = 'todos' | 'hoy' | 'semana' | 'proximos';

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'todos',    label: 'Todas las fechas' },
  { value: 'hoy',      label: 'Hoy' },
  { value: 'semana',   label: 'Próximos 7 días' },
  { value: 'proximos', label: 'De hoy en adelante' },
];

/** Límite superior del período, en formato "YYYY-MM-DD". */
function hastaDe(periodo: Periodo): string | null {
  if (periodo === 'hoy') return hoyISO();
  if (periodo === 'semana') {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return claveDeDia(d);
  }
  return null;
}

export default function MedicoTurnos() {
  const { data: turnos, isLoading } = useMiAgenda();
  const [params, setParams] = useSearchParams();

  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<TurnoStatus | ''>('');
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [target, setTarget] = useState<Turno | null>(null);
  const [destinoInicial, setDestinoInicial] = useState<TurnoStatus | null>(null);

  // Se puede llegar acá desde el historial de un paciente con ?turno=<id>
  const turnoDestacado = params.get('turno');

  const filtrados = useMemo(() => {
    const lista = turnos ?? [];

    // Con un turno puntual apuntado, se ignoran los filtros: lo importante es mostrarlo
    if (turnoDestacado) return lista.filter(t => t.id === turnoDestacado);

    const texto = normalizar(busqueda);
    const hoy = hoyISO();
    const hasta = hastaDe(periodo);

    return lista
      .filter(t => {
        if (estado && t.status !== estado) return false;

        const dia = claveFecha(t.fecha);
        if (periodo !== 'todos') {
          if (dia < hoy) return false;
          if (hasta && dia > hasta) return false;
        }

        if (!texto) return true;
        const p = t.paciente;
        return normalizar(`${p?.nombre ?? ''} ${p?.apellido ?? ''} ${p?.dni ?? ''} ${t.motivo ?? ''}`)
          .includes(texto);
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
  }, [turnos, busqueda, estado, periodo, turnoDestacado]);

  // Si el turno apuntado ya no existe (por ejemplo se recargó con otro usuario), se limpia
  useEffect(() => {
    if (turnoDestacado && !isLoading && filtrados.length === 0) setParams({}, { replace: true });
  }, [turnoDestacado, isLoading, filtrados.length, setParams]);

  const abrir = (turno: Turno, destino: TurnoStatus | null = null) => {
    setTarget(turno);
    setDestinoInicial(destino);
  };

  const hayFiltros = !!busqueda || !!estado || periodo !== 'todos';

  return (
    <PageTransition>
      <PageHeader
        title="Administrar turnos"
        description="Buscá un turno, cambiá su estado o deshacé un cambio hecho por error."
      />

      {turnoDestacado ? (
        <AlertInline tono="info" className="mb-4">
          <span className="flex flex-wrap items-center gap-2">
            Mostrando un turno puntual.
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className="font-semibold underline underline-offset-2"
            >
              Ver todos los turnos
            </button>
          </span>
        </AlertInline>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <SearchInput
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por paciente, DNI o motivo…"
            className="sm:max-w-sm"
          />
          <Select
            value={estado}
            onChange={e => setEstado(e.target.value as TurnoStatus | '')}
            className="sm:w-56"
            aria-label="Filtrar por estado"
          >
            {ESTADOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select
            value={periodo}
            onChange={e => setPeriodo(e.target.value as Periodo)}
            className="sm:w-52"
            aria-label="Filtrar por fecha"
          >
            {PERIODOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          {hayFiltros && (
            <Button
              variant="ghost"
              iconLeft={<IconX />}
              onClick={() => { setBusqueda(''); setEstado(''); setPeriodo('todos'); }}
            >
              Limpiar
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : filtrados.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconCalendar />}
            title={hayFiltros ? 'Sin resultados' : 'Todavía no tenés turnos'}
            description={
              hayFiltros
                ? 'Ningún turno coincide con los filtros elegidos.'
                : 'Cuando te asignen turnos van a aparecer acá.'
            }
            action={hayFiltros ? (
              <Button variant="secondary" onClick={() => { setBusqueda(''); setEstado(''); setPeriodo('todos'); }}>
                Limpiar filtros
              </Button>
            ) : undefined}
          />
        </Card>
      ) : (
        <>
          <p className="text-[13px] text-slate-500 mb-2.5">
            {filtrados.length} {filtrados.length === 1 ? 'turno' : 'turnos'}
          </p>
          <Card className="overflow-hidden">
            <Table>
              <THead>
                <TH>Paciente</TH>
                <TH>Fecha y hora</TH>
                <TH>Motivo</TH>
                <TH>Estado</TH>
                <TH align="right">Acciones</TH>
              </THead>
              <TBody>
                {filtrados.map(t => (
                  <FilaTurno key={t.id} turno={t} onAbrir={abrir} />
                ))}
              </TBody>
            </Table>
          </Card>
        </>
      )}

      <CambiarEstadoDialog
        turno={target}
        destinoInicial={destinoInicial}
        onClose={() => { setTarget(null); setDestinoInicial(null); }}
      />
    </PageTransition>
  );
}

interface FilaProps {
  turno: Turno;
  onAbrir: (turno: Turno, destino?: TurnoStatus | null) => void;
}

function FilaTurno({ turno, onAbrir }: FilaProps) {
  const avances = avancesDe(turno.status);
  const reversiones = reversionesDe(turno.status);
  // Deshacer directo cuando hay una sola vuelta atrás razonable (lo habitual)
  const deshacerRapido = reversiones.length > 0 ? reversiones[0] : null;

  return (
    <TR>
      <TD className="font-medium text-slate-900 whitespace-nowrap">
        {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : '—'}
        {turno.paciente?.dni && (
          <span className="block text-[12px] text-slate-400 font-normal tnum">DNI {turno.paciente.dni}</span>
        )}
      </TD>
      <TD className="whitespace-nowrap tnum">
        {formatFecha(turno.fecha)}
        <span className="block text-[12px] text-slate-400">{turno.hora} hs</span>
      </TD>
      <TD className="text-slate-500 max-w-[16rem]">
        <span className="line-clamp-2">{turno.motivo || '—'}</span>
      </TD>
      <TD>
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={turno.status} />
          {turno.esSobreturno && (
            <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-amber-700 text-[11px] font-semibold">
              Sobreturno
            </span>
          )}
        </div>
      </TD>
      <TD align="right">
        <div className="flex items-center justify-end gap-1.5">
          {deshacerRapido && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAbrir(turno, deshacerRapido)}
              title={`Deshacer: ${ACCIONES[deshacerRapido].toLowerCase()}`}
            >
              Deshacer
            </Button>
          )}
          {avances.length > 0 ? (
            <Button variant="secondary" size="sm" iconLeft={<IconClipboard />} onClick={() => onAbrir(turno)}>
              Cambiar
            </Button>
          ) : !deshacerRapido ? (
            <span className="text-slate-300 text-sm">—</span>
          ) : null}
        </div>
      </TD>
    </TR>
  );
}
