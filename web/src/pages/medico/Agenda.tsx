import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useMiAgenda, useUpdateTurnoStatus } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, Textarea, PageHeader, StatusBadge, EmptyState, SkeletonTable, Tabs,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconCalendar, IconAlert } from '../../ui/icons';
import { formatFecha } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { Turno } from '../../services';

type NextOpt = { label: string; status: 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' };
const NEXT: Record<string, NextOpt[]> = {
  PENDIENTE:  [{ label: 'Confirmar', status: 'CONFIRMADO' }, { label: 'Cancelar', status: 'CANCELADO' }],
  CONFIRMADO: [{ label: 'Completar', status: 'COMPLETADO' }, { label: 'Cancelar', status: 'CANCELADO' }],
  COMPLETADO: [],
  CANCELADO:  [],
};

export default function MedicoAgenda() {
  const { data: turnos, isLoading } = useMiAgenda();
  const update = useUpdateTurnoStatus();

  const [tab, setTab] = useState('proximos');
  const [target, setTarget] = useState<Turno | null>(null);
  const [nuevoStatus, setNuevoStatus] = useState<NextOpt['status'] | ''>('');
  const [notas, setNotas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [error, setError] = useState('');

  const { proximos, historial } = useMemo(() => {
    const list = turnos ?? [];
    return {
      proximos: list.filter(t => t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'),
      historial: list.filter(t => t.status === 'COMPLETADO' || t.status === 'CANCELADO'),
    };
  }, [turnos]);

  const visibles = tab === 'proximos' ? proximos : historial;

  const openCambiar = (t: Turno) => {
    setTarget(t); setNuevoStatus(''); setNotas(t.notas ?? ''); setDiagnostico(t.diagnostico ?? ''); setError('');
  };

  const handleGuardar = async () => {
    if (!target || !nuevoStatus) return setError('Elegí el nuevo estado');
    setError('');
    try {
      await update.mutateAsync({
        id: target.id, status: nuevoStatus,
        notas: notas.trim() || undefined,
        diagnostico: diagnostico.trim() || undefined,
      });
      toast.success('Turno actualizado');
      setTarget(null);
    } catch (e) {
      setError(apiError(e, 'No se pudo actualizar el turno'));
    }
  };

  return (
    <PageTransition>
      <PageHeader title="Mi agenda" description="Tus turnos asignados. Confirmá, completá o cancelá según corresponda." />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'proximos', label: 'Próximos', count: proximos.length },
          { id: 'historial', label: 'Historial', count: historial.length },
        ]}
      />

      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : !visibles.length ? (
        <Card>
          <EmptyState
            icon={<IconCalendar />}
            title={tab === 'proximos' ? 'Sin turnos próximos' : 'Sin historial'}
            description={tab === 'proximos' ? 'Cuando te asignen turnos van a aparecer acá.' : 'Acá vas a ver los turnos completados y cancelados.'}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TH>Paciente</TH>
              <TH>Fecha y hora</TH>
              <TH>Motivo</TH>
              <TH>Estado</TH>
              <TH />
            </THead>
            <TBody>
              {visibles.map(t => (
                <TR key={t.id}>
                  <TD className="font-medium text-slate-900 whitespace-nowrap">
                    {t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '—'}
                    {t.paciente?.dni ? <span className="text-slate-400 font-normal"> · DNI {t.paciente.dni}</span> : null}
                  </TD>
                  <TD className="whitespace-nowrap">{formatFecha(t.fecha)} · {t.hora}</TD>
                  <TD className="text-slate-500">{t.motivo || '—'}</TD>
                  <TD><StatusBadge status={t.status} /></TD>
                  <TD className="text-right">
                    {(NEXT[t.status] ?? []).length > 0 ? (
                      <Button variant="ghost" size="sm" onClick={() => openCambiar(t)}>Cambiar estado</Button>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Dialog
        open={!!target}
        onClose={() => setTarget(null)}
        title="Cambiar estado del turno"
        description={target?.paciente ? `${target.paciente.nombre} ${target.paciente.apellido} · ${formatFecha(target.fecha)} ${target.hora}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={update.isPending} disabled={!nuevoStatus}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-2">Nuevo estado</p>
            <div className="flex gap-2.5">
              {(target ? NEXT[target.status] ?? [] : []).map(opt => (
                <button
                  key={opt.status}
                  type="button"
                  onClick={() => setNuevoStatus(opt.status)}
                  className={cn(
                    'flex-1 py-2.5 rounded-field text-sm font-semibold ring-1 ring-inset transition-colors',
                    nuevoStatus === opt.status
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Notas para el paciente" hint="Opcional" value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
          {nuevoStatus === 'COMPLETADO' && (
            <Textarea label="Diagnóstico / observaciones" hint="Opcional" value={diagnostico} onChange={e => setDiagnostico(e.target.value)} rows={3} />
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
