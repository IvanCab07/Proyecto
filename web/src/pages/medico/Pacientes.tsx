import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import {
  usePacientesDelMedico, useRecetasMedico, useCrearReceta, useEliminarReceta,
} from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { RecetaForm } from '../../components/medico/RecetaForm';
import { EstudiosPaciente } from '../../components/medico/EstudiosPaciente';
import {
  Card, Button, Dialog, ConfirmDialog, SearchInput, PageHeader,
  StatusBadge, EmptyState, SkeletonTable, Avatar, Tabs,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconUsers, IconPlus, IconTrash, IconArrowUpRight } from '../../ui/icons';
import { formatFecha } from '../../lib/format';
import { VigenciaBadge } from '../../components/VigenciaBadge';
import { normalizar } from '../../lib/validaciones';
import type { CreateRecetaDTO, PacienteRef, Receta, Turno } from '../../services';

export default function MedicoPacientes() {
  const navigate = useNavigate();
  const { agenda, pacientes, isLoading } = usePacientesDelMedico();
  const { data: recetas } = useRecetasMedico();
  const crearReceta = useCrearReceta();
  const eliminarReceta = useEliminarReceta();

  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<PacienteRef | null>(null);
  const [tab, setTab] = useState('turnos');
  const [recetaModal, setRecetaModal] = useState(false);
  const [pacienteReceta, setPacienteReceta] = useState<PacienteRef | null>(null);
  const [recetaError, setRecetaError] = useState('');
  const [aBorrar, setABorrar] = useState<Receta | null>(null);

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda);
    if (!texto) return pacientes;
    return pacientes.filter(p => normalizar(`${p.nombre} ${p.apellido} ${p.dni}`).includes(texto));
  }, [pacientes, busqueda]);

  const turnosPaciente = useMemo(
    () => (agenda ?? [])
      .filter(t => t.paciente?.id === seleccionado?.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora)),
    [agenda, seleccionado],
  );

  const recetasPaciente = useMemo(
    () => (recetas ?? []).filter(r => r.paciente?.id === seleccionado?.id),
    [recetas, seleccionado],
  );

  const abrirPaciente = (p: PacienteRef) => { setSeleccionado(p); setTab('turnos'); };

  // El formulario se abre en su propio diálogo y cierra el historial: si quedaran los dos
  // abiertos a la vez, ambos bloquean el scroll del body y al cerrar el de arriba queda mal.
  const abrirReceta = () => {
    setPacienteReceta(seleccionado);
    setRecetaError('');
    setSeleccionado(null);
    setRecetaModal(true);
  };

  const handleEmitirReceta = async (data: CreateRecetaDTO) => {
    setRecetaError('');
    try {
      await crearReceta.mutateAsync(data);
      toast.success('Receta emitida correctamente');
      setRecetaModal(false);
    } catch (e) {
      setRecetaError(apiError(e, 'Error al emitir la receta'));
      throw e;
    }
  };

  const handleEliminarReceta = async () => {
    if (!aBorrar) return;
    try {
      await eliminarReceta.mutateAsync(aBorrar.id);
      toast.success('Receta eliminada');
      setABorrar(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo eliminar la receta'));
    }
  };

  const total = pacientes.length;

  return (
    <PageTransition>
      <PageHeader
        title="Mis pacientes"
        description={total === 1 ? '1 paciente atendido' : `${total} pacientes atendidos`}
      />

      <SearchInput
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, apellido o DNI…"
        className="max-w-md mb-4"
      />

      {isLoading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : !filtrados.length ? (
        <Card>
          <EmptyState
            icon={<IconUsers />}
            title={busqueda ? 'Sin resultados' : 'Todavía no atendiste pacientes'}
            description={
              busqueda
                ? `Ningún paciente coincide con “${busqueda}”.`
                : 'Cuando tengas turnos asignados, tus pacientes van a aparecer acá.'
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TH>Paciente</TH>
              <TH>DNI</TH>
              <TH />
            </THead>
            <TBody>
              {filtrados.map(p => (
                <TR key={p.id} interactive onClick={() => abrirPaciente(p)}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" nombre={p.nombre} apellido={p.apellido} />
                      <span className="font-medium text-slate-900 whitespace-nowrap">{p.nombre} {p.apellido}</span>
                    </div>
                  </TD>
                  <TD className="tnum">{p.dni}</TD>
                  <TD className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => { e.stopPropagation(); abrirPaciente(p); }}
                    >
                      Ver historial
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* Historial del paciente */}
      <Dialog
        open={!!seleccionado}
        onClose={() => setSeleccionado(null)}
        title={seleccionado ? `${seleccionado.nombre} ${seleccionado.apellido}` : ''}
        description={seleccionado ? `DNI ${seleccionado.dni}` : undefined}
        size="lg"
      >
        {seleccionado && (
          <div>
            <Tabs
              className="mb-4"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'turnos',   label: 'Turnos',   count: turnosPaciente.length },
                { id: 'recetas',  label: 'Recetas',  count: recetasPaciente.length },
                { id: 'estudios', label: 'Estudios' },
              ]}
            />

            {tab === 'turnos' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 min-h-[200px]">
                {turnosPaciente.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">Sin turnos registrados.</p>
                ) : turnosPaciente.map(t => (
                  <TurnoDelHistorial
                    key={t.id}
                    turno={t}
                    onAbrir={() => navigate(`/medico/turnos?turno=${t.id}`)}
                  />
                ))}
              </div>
            )}

            {tab === 'recetas' && (
              <div className="min-h-[200px]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[13px] text-slate-500">Recetas que le emitiste.</p>
                  <Button size="sm" iconLeft={<IconPlus />} onClick={abrirReceta}>Nueva receta</Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {recetasPaciente.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">Sin recetas emitidas.</p>
                  ) : recetasPaciente.map(r => (
                    <div key={r.id} className="px-3.5 py-3 rounded-field ring-1 ring-inset ring-slate-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm">{r.medicamento}</p>
                          <p className="text-[13px] text-brand-700 font-medium">{r.dosis}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-slate-400 tnum whitespace-nowrap">
                            {formatFecha(r.fechaEmision)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Eliminar receta de ${r.medicamento}`}
                            className="text-danger hover:bg-danger-soft"
                            onClick={() => setABorrar(r)}
                          >
                            <IconTrash />
                          </Button>
                        </div>
                      </div>
                      {r.indicacion && <p className="text-[13px] text-slate-600 mt-1.5">{r.indicacion}</p>}
                      <VigenciaBadge validoHasta={r.validoHasta} className="mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'estudios' && <EstudiosPaciente paciente={seleccionado} />}
          </div>
        )}
      </Dialog>

      {/* Emitir receta */}
      <Dialog
        open={recetaModal}
        onClose={() => setRecetaModal(false)}
        title="Emitir nueva receta"
        description={
          pacienteReceta ? `Para ${pacienteReceta.nombre} ${pacienteReceta.apellido}` : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setRecetaModal(false)}>Cancelar</Button>
            <Button type="submit" form="receta-paciente" loading={crearReceta.isPending}>
              Emitir receta
            </Button>
          </>
        }
      >
        {pacienteReceta && (
          <RecetaForm
            formId="receta-paciente"
            pacienteFijo={pacienteReceta.id}
            onSubmit={handleEmitirReceta}
            error={recetaError}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!aBorrar}
        onClose={() => setABorrar(null)}
        onConfirm={handleEliminarReceta}
        title="Eliminar receta"
        message={`Se va a eliminar la receta de ${aBorrar?.medicamento}. El paciente va a dejar de verla.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={eliminarReceta.isPending}
      />
    </PageTransition>
  );
}

// Cada turno del historial abre ese turno en "Administrar turnos", para poder revisarlo
// o corregir su estado sin tener que buscarlo a mano.
function TurnoDelHistorial({ turno, onAbrir }: { turno: Turno; onAbrir: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir(); }
      }}
      className="group flex items-start justify-between gap-3 px-3.5 py-3 rounded-field ring-1 ring-inset ring-slate-100 cursor-pointer transition-colors hover:ring-brand-200 hover:bg-brand-50/40 focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm">{formatFecha(turno.fecha)} · {turno.hora}</p>
        {turno.motivo && <p className="text-[13px] text-slate-400 italic mt-1">“{turno.motivo}”</p>}
        {turno.diagnostico && (
          <p className="text-[13px] mt-1.5 px-2.5 py-1.5 rounded-lg bg-success-soft text-success-text">
            {turno.diagnostico}
          </p>
        )}
        <p className="flex items-center gap-1 text-[12px] text-brand-700 mt-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
          Ver en turnos <IconArrowUpRight className="w-3.5 h-3.5" />
        </p>
      </div>
      <StatusBadge status={turno.status} />
    </div>
  );
}

