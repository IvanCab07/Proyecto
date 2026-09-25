import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useAllTurnos, useUpdateTurnoStatus } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, Textarea, SearchInput, PageHeader, StatusBadge, StatCard,
  EmptyState, SkeletonTable, Menu, Tabs,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import {
  IconCalendar, IconAlert, IconDots, IconCheck, IconX, IconClock, IconUsers,
} from '../../ui/icons';
import { formatFecha } from '../../lib/format';
import type { Turno, TurnoStatus } from '../../services';

type Accion = { label: string; status: TurnoStatus; tone?: 'default' | 'danger' };

// Transiciones válidas desde cada estado. Los estados finales no ofrecen acciones.
const ACCIONES: Record<TurnoStatus, Accion[]> = {
  PENDIENTE: [
    { label: 'Confirmar', status: 'CONFIRMADO' },
    { label: 'Cancelar', status: 'CANCELADO', tone: 'danger' },
  ],
  CONFIRMADO: [
    { label: 'Completar', status: 'COMPLETADO' },
    { label: 'Marcar ausente', status: 'AUSENTE' },
    { label: 'Cancelar', status: 'CANCELADO', tone: 'danger' },
  ],
  EN_ESPERA: [
    { label: 'Cancelar', status: 'CANCELADO', tone: 'danger' },
  ],
  COMPLETADO: [],
  CANCELADO: [],
  AUSENTE: [],
};

const TITULO_ACCION: Record<string, string> = {
  CONFIRMADO: 'Confirmar turno',
  COMPLETADO: 'Completar turno',
  CANCELADO: 'Cancelar turno',
  AUSENTE: 'Marcar como ausente',
};

type TabId = 'hoy' | 'pendientes' | 'espera' | 'confirmados' | 'historial';

const FINALES: TurnoStatus[] = ['COMPLETADO', 'CANCELADO', 'AUSENTE'];

export default function AdminTurnos() {
  const { data: turnos, isLoading } = useAllTurnos();
  const update = useUpdateTurnoStatus();

  const [tab, setTab] = useState<TabId>('hoy');
  const [busqueda, setBusqueda] = useState('');
  const [target, setTarget] = useState<Turno | null>(null);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [notas, setNotas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [error, setError] = useState('');

  const hoy = new Date().toISOString().slice(0, 10);

  const grupos = useMemo(() => {
    const list = turnos ?? [];
    return {
      hoy:         list.filter(t => t.fecha.slice(0, 10) === hoy && !FINALES.includes(t.status)),
      pendientes:  list.filter(t => t.status === 'PENDIENTE'),
      espera:      list.filter(t => t.status === 'EN_ESPERA'),
      confirmados: list.filter(t => t.status === 'CONFIRMADO'),
      historial:   list.filter(t => FINALES.includes(t.status)),
    };
  }, [turnos, hoy]);

  const ausentesDelMes = useMemo(() => {
    const mes = hoy.slice(0, 7);
    return (turnos ?? []).filter(t => t.status === 'AUSENTE' && t.fecha.slice(0, 7) === mes).length;
  }, [turnos, hoy]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const list = grupos[tab];
    if (!q) return list;
    return list.filter(t =>
      `${t.paciente?.nombre ?? ''} ${t.paciente?.apellido ?? ''} ${t.paciente?.dni ?? ''} ${t.medico?.nombre ?? ''} ${t.medico?.apellido ?? ''} ${t.medico?.especialidad.nombre ?? ''}`
        .toLowerCase()
        .includes(q));
  }, [grupos, tab, busqueda]);

  const abrirAccion = (t: Turno, a: Accion) => {
    setTarget(t);
    setAccion(a);
    setNotas(t.notas ?? '');
    setDiagnostico(t.diagnostico ?? '');
    setError('');
  };

  const cerrar = () => { setTarget(null); setAccion(null); };

  const handleConfirmar = async () => {
    if (!target || !accion) return;
    setError('');
    try {
      await update.mutateAsync({
        id: target.id,
        status: accion.status,
        notas: notas.trim() || undefined,
        diagnostico: accion.status === 'COMPLETADO' ? diagnostico.trim() || undefined : undefined,
      });
      toast.success('Turno actualizado');
      cerrar();
    } catch (e) {
      setError(apiError(e, 'No se pudo actualizar el turno'));
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Turnos"
        description="Confirmá, completá o cancelá los turnos de todo el hospital."
      />

      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard label="Turnos hoy" value={grupos.hoy.length} icon={<IconCalendar />} tone="brand" />
          <StatCard label="A confirmar" value={grupos.pendientes.length} icon={<IconClock />} tone="warning" />
          <StatCard label="En espera" value={grupos.espera.length} icon={<IconUsers />} hint="Sobreturnos en cola" />
          <StatCard label="Ausentes del mes" value={ausentesDelMes} icon={<IconX />} tone={ausentesDelMes > 0 ? 'danger' : 'default'} />
        </div>
      )}

      <Tabs
        className="mb-4"
        value={tab}
        onChange={v => setTab(v as TabId)}
        tabs={[
          { id: 'hoy', label: 'Hoy', count: grupos.hoy.length },
          { id: 'pendientes', label: 'Pendientes', count: grupos.pendientes.length },
          { id: 'espera', label: 'En espera', count: grupos.espera.length },
          { id: 'confirmados', label: 'Confirmados', count: grupos.confirmados.length },
          { id: 'historial', label: 'Historial', count: grupos.historial.length },
        ]}
      />

      <SearchInput
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por paciente, DNI, médico o especialidad…"
        className="max-w-md mb-4"
      />

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : !visibles.length ? (
        <Card>
          <EmptyState
            icon={<IconCalendar />}
            title={busqueda ? 'Sin resultados' : 'Sin turnos'}
            description={
              busqueda
                ? `Ningún turno coincide con “${busqueda}”.`
                : tab === 'hoy' ? 'No hay turnos agendados para hoy.'
                : tab === 'espera' ? 'No hay sobreturnos esperando que se libere un horario.'
                : 'Cuando haya turnos en este estado van a aparecer acá.'
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TH>Paciente</TH>
              <TH>Médico</TH>
              <TH>Fecha y hora</TH>
              <TH>Motivo</TH>
              <TH>Estado</TH>
              <TH />
            </THead>
            <TBody>
              {visibles.map(t => {
                const acciones = ACCIONES[t.status] ?? [];
                return (
                  <TR key={t.id}>
                    <TD className="font-medium text-slate-900 whitespace-nowrap">
                      {t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '—'}
                      {t.paciente?.dni ? <span className="text-slate-400 font-normal"> · DNI {t.paciente.dni}</span> : null}
                    </TD>
                    <TD className="whitespace-nowrap">
                      <span className="text-slate-900">Dr. {t.medico?.apellido ?? '—'}</span>
                      <span className="block text-xs text-slate-400">{t.medico?.especialidad.nombre}</span>
                    </TD>
                    <TD className="whitespace-nowrap">{formatFecha(t.fecha)} · {t.hora}</TD>
                    <TD className="text-slate-500 max-w-[24ch] truncate" title={t.motivo || undefined}>
                      {t.motivo || '—'}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={t.status} />
                        {t.esSobreturno && (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold whitespace-nowrap">
                            Sobreturno
                          </span>
                        )}
                      </div>
                    </TD>
                    <TD className="text-right">
                      {acciones.length ? (
                        <Menu
                          trigger={<IconDots />}
                          triggerLabel={`Acciones para el turno de ${t.paciente?.apellido ?? 'paciente'}`}
                          items={acciones.map(a => ({
                            label: a.label,
                            icon: a.status === 'CANCELADO' ? <IconX /> : a.status === 'AUSENTE' ? <IconClock /> : <IconCheck />,
                            tone: a.tone,
                            onSelect: () => abrirAccion(t, a),
                          }))}
                        />
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      <Dialog
        open={!!target && !!accion}
        onClose={cerrar}
        title={accion ? TITULO_ACCION[accion.status] ?? 'Cambiar estado' : ''}
        description={target
          ? `${target.paciente ? `${target.paciente.nombre} ${target.paciente.apellido}` : 'Paciente'} · Dr. ${target.medico?.apellido ?? '—'} · ${formatFecha(target.fecha)} ${target.hora}`
          : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={cerrar}>Volver</Button>
            <Button
              variant={accion?.tone === 'danger' ? 'danger' : 'primary'}
              onClick={handleConfirmar}
              loading={update.isPending}
            >
              {accion?.label ?? 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Al liberar un horario ocupado, el backend promueve el sobreturno más antiguo */}
          {(accion?.status === 'CANCELADO' || accion?.status === 'AUSENTE')
            && (target?.status === 'PENDIENTE' || target?.status === 'CONFIRMADO') && (
            <p className="text-[13px] rounded-field px-3.5 py-3 bg-info-soft text-info-text font-medium">
              Se libera el horario: si hay un sobreturno esperando, se le cede automáticamente.
            </p>
          )}
          <Textarea
            label={accion?.status === 'CANCELADO' ? 'Motivo de la cancelación' : 'Notas para el paciente'}
            hint="Opcional. El paciente lo ve junto al turno."
            rows={2}
            value={notas}
            onChange={e => setNotas(e.target.value)}
          />
          {accion?.status === 'COMPLETADO' && (
            <Textarea
              label="Diagnóstico / observaciones"
              hint="Opcional"
              rows={3}
              value={diagnostico}
              onChange={e => setDiagnostico(e.target.value)}
            />
          )}
          {error && (
            <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium">
              <IconAlert className="shrink-0" />
              {error}
            </div>
          )}
        </div>
      </Dialog>
    </PageTransition>
  );
}
