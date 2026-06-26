import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAllTurnos, useUpdateTurnoStatus } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, Select, Textarea, SearchInput, PageHeader,
  StatusBadge, EmptyState, SkeletonTable, Avatar,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconCalendar } from '../../ui/icons';
import { formatFecha } from '../../lib/format';
import type { Turno } from '../../services';

const ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO', 'AUSENTE', 'EN_ESPERA'];
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente', CONFIRMADO: 'Confirmado', COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado', AUSENTE: 'Ausente', EN_ESPERA: 'En espera',
};

const filtroFieldCls =
  'h-10 px-3.5 bg-surface rounded-field text-sm text-slate-700 shadow-xs ring-1 ring-inset ring-slate-200 ' +
  'outline-none focus:outline-none focus:ring-2 focus:ring-brand-600 transition-shadow duration-150';

export default function AdminTurnos() {
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [nuevoStatus, setNuevoStatus] = useState('');
  const [notas, setNotas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  const { data: turnosRaw, isLoading } = useAllTurnos({
    status: filtroStatus || undefined,
    fecha: filtroFecha || undefined,
  });

  const turnos = filtroPaciente.trim()
    ? turnosRaw?.filter(t => {
        const nombre = `${t.paciente?.nombre ?? ''} ${t.paciente?.apellido ?? ''}`.toLowerCase();
        return nombre.includes(filtroPaciente.toLowerCase());
      })
    : turnosRaw;
  const updateStatus = useUpdateTurnoStatus();

  const hayFiltros = Boolean(filtroStatus || filtroFecha || filtroPaciente);

  const openModal = (t: Turno) => {
    setTurnoSeleccionado(t);
    setNuevoStatus(t.status);
    setNotas(t.notas ?? '');
    setDiagnostico(t.diagnostico ?? '');
  };

  const handleGuardar = async () => {
    if (!turnoSeleccionado) return;
    try {
      await updateStatus.mutateAsync({ id: turnoSeleccionado.id, status: nuevoStatus, notas, diagnostico });
      toast.success('Turno actualizado');
      setTurnoSeleccionado(null);
    } catch {
      toast.error('Error al actualizar el turno');
    }
  };

  return (
    <PageTransition>
      <PageHeader title="Turnos" description="Todos los turnos del hospital, en un solo lugar." />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={filtroFieldCls}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
        </select>
        <input
          type="date"
          value={filtroFecha}
          onChange={e => setFiltroFecha(e.target.value)}
          className={filtroFieldCls}
        />
        <SearchInput
          value={filtroPaciente}
          onChange={e => setFiltroPaciente(e.target.value)}
          placeholder="Buscar paciente…"
          className="w-56"
        />
        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={() => { setFiltroStatus(''); setFiltroFecha(''); setFiltroPaciente(''); }}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : !turnos?.length ? (
        <Card>
          <EmptyState
            icon={<IconCalendar />}
            title={hayFiltros ? 'Nada por acá' : 'Sin turnos'}
            description={
              hayFiltros
                ? 'Ningún turno coincide con los filtros. Probá ajustarlos o limpiarlos.'
                : 'Cuando los pacientes soliciten turnos van a aparecer en esta tabla.'
            }
            action={hayFiltros ? (
              <Button variant="secondary" onClick={() => { setFiltroStatus(''); setFiltroFecha(''); setFiltroPaciente(''); }}>
                Limpiar filtros
              </Button>
            ) : undefined}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TH>Paciente</TH>
              <TH>Médico</TH>
              <TH>Especialidad</TH>
              <TH>Fecha</TH>
              <TH align="right">Hora</TH>
              <TH>Estado</TH>
              <TH />
            </THead>
            <TBody>
              {turnos.map(t => {
                const pacNombre = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '—';
                return (
                  <TR key={t.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm" nombre={t.paciente?.nombre} apellido={t.paciente?.apellido} />
                        <span className="font-medium text-slate-900 whitespace-nowrap">{pacNombre}</span>
                      </div>
                    </TD>
                    <TD className="whitespace-nowrap">Dr. {t.medico.nombre} {t.medico.apellido}</TD>
                    <TD>
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium whitespace-nowrap">
                        {t.medico.especialidad.nombre}
                      </span>
                    </TD>
                    <TD className="whitespace-nowrap tnum">{formatFecha(t.fecha)}</TD>
                    <TD numeric className="font-medium text-slate-900">{t.hora}</TD>
                    <TD><StatusBadge status={t.status} /></TD>
                    <TD className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openModal(t)}>
                        Editar
                      </Button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      <Dialog
        open={!!turnoSeleccionado}
        onClose={() => setTurnoSeleccionado(null)}
        title="Actualizar turno"
        description={turnoSeleccionado
          ? `${turnoSeleccionado.paciente ? `${turnoSeleccionado.paciente.nombre} ${turnoSeleccionado.paciente.apellido} · ` : ''}${formatFecha(turnoSeleccionado.fecha)} ${turnoSeleccionado.hora} hs`
          : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTurnoSeleccionado(null)}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={updateStatus.isPending}>Guardar cambios</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Estado" value={nuevoStatus} onChange={e => setNuevoStatus(e.target.value)}>
            {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
          </Select>
          <Textarea
            label="Notas"
            hint="Visible para el paciente"
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            placeholder="Notas adicionales…"
          />
          {nuevoStatus === 'COMPLETADO' && (
            <Textarea
              label="Diagnóstico"
              value={diagnostico}
              onChange={e => setDiagnostico(e.target.value)}
              rows={3}
              placeholder="Diagnóstico…"
            />
          )}
        </div>
      </Dialog>
    </PageTransition>
  );
}
