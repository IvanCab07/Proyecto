import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useMiAgenda, useRecetasMedico, useCrearReceta } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, Input, Textarea, SearchInput, PageHeader,
  StatusBadge, EmptyState, SkeletonTable, Avatar, Tabs,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconUsers, IconPlus, IconAlert } from '../../ui/icons';
import { formatFecha } from '../../lib/format';

interface PacienteRef { id: string; nombre: string; apellido: string; dni: string; }
const EMPTY_RECETA = { medicamento: '', dosis: '', indicacion: '', validoHasta: '' };

export default function MedicoPacientes() {
  const { data: agenda, isLoading } = useMiAgenda();
  const { data: recetas } = useRecetasMedico();
  const crearReceta = useCrearReceta();

  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<PacienteRef | null>(null);
  const [tab, setTab] = useState('turnos');
  const [recetaModal, setRecetaModal] = useState(false);
  const [recetaForm, setRecetaForm] = useState(EMPTY_RECETA);
  const [recetaError, setRecetaError] = useState('');

  // Pacientes únicos derivados de los turnos del médico
  const pacientes = useMemo<PacienteRef[]>(() => {
    const map = new Map<string, PacienteRef>();
    for (const t of agenda ?? []) {
      if (t.paciente && !map.has(t.paciente.id)) map.set(t.paciente.id, t.paciente);
    }
    return [...map.values()].sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [agenda]);

  const filtrados = pacientes.filter(p =>
    `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const turnosPaciente = (agenda ?? []).filter(t => t.paciente?.id === seleccionado?.id);
  const recetasPaciente = (recetas ?? []).filter(r => r.paciente?.id === seleccionado?.id);

  const abrirReceta = () => { setRecetaForm(EMPTY_RECETA); setRecetaError(''); setRecetaModal(true); };

  const handleEmitirReceta = async () => {
    if (!seleccionado) return;
    if (!recetaForm.medicamento || !recetaForm.dosis || !recetaForm.indicacion) {
      return setRecetaError('Medicamento, dosis e indicación son obligatorios');
    }
    setRecetaError('');
    try {
      await crearReceta.mutateAsync({
        pacienteId: seleccionado.id,
        medicamento: recetaForm.medicamento,
        dosis: recetaForm.dosis,
        indicacion: recetaForm.indicacion,
        validoHasta: recetaForm.validoHasta ? new Date(recetaForm.validoHasta).toISOString() : undefined,
      });
      toast.success('Receta emitida correctamente');
      setRecetaModal(false);
      setRecetaForm(EMPTY_RECETA);
    } catch (e) {
      setRecetaError(apiError(e, 'Error al emitir la receta'));
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
                <TR key={p.id} interactive onClick={() => { setSeleccionado(p); setTab('turnos'); }}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" nombre={p.nombre} apellido={p.apellido} />
                      <span className="font-medium text-slate-900 whitespace-nowrap">{p.nombre} {p.apellido}</span>
                    </div>
                  </TD>
                  <TD className="tnum">{p.dni}</TD>
                  <TD className="text-right">
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setSeleccionado(p); setTab('turnos'); }}>
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
                { id: 'turnos',  label: 'Turnos',  count: turnosPaciente.length },
                { id: 'recetas', label: 'Recetas', count: recetasPaciente.length },
              ]}
            />

            {tab === 'turnos' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 min-h-[200px]">
                {turnosPaciente.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">Sin turnos registrados.</p>
                ) : turnosPaciente.map(t => (
                  <div key={t.id} className="flex items-start justify-between gap-3 px-3.5 py-3 rounded-field ring-1 ring-inset ring-slate-100">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{formatFecha(t.fecha)} · {t.hora}</p>
                      {t.motivo && <p className="text-[13px] text-slate-400 italic mt-1">“{t.motivo}”</p>}
                      {t.diagnostico && (
                        <p className="text-[13px] mt-1.5 px-2.5 py-1.5 rounded-lg bg-success-soft text-success-text">{t.diagnostico}</p>
                      )}
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}

            {tab === 'recetas' && (
              <div className="min-h-[200px]">
                <div className="flex justify-end mb-3">
                  <Button size="sm" iconLeft={<IconPlus />} onClick={abrirReceta}>Nueva receta</Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {recetasPaciente.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">Sin recetas emitidas.</p>
                  ) : recetasPaciente.map(r => (
                    <div key={r.id} className="px-3.5 py-3 rounded-field ring-1 ring-inset ring-slate-100">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{r.medicamento}</p>
                          <p className="text-[13px] text-brand-700 font-medium">{r.dosis}</p>
                        </div>
                        <span className="text-xs text-slate-400 tnum whitespace-nowrap">{formatFecha(r.fechaEmision)}</span>
                      </div>
                      {r.indicacion && <p className="text-[13px] text-slate-600 mt-1.5">{r.indicacion}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Emitir receta */}
      <Dialog
        open={recetaModal}
        onClose={() => setRecetaModal(false)}
        title="Emitir nueva receta"
        description={seleccionado ? `Para ${seleccionado.nombre} ${seleccionado.apellido}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRecetaModal(false)}>Cancelar</Button>
            <Button onClick={handleEmitirReceta} loading={crearReceta.isPending}>Emitir receta</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Medicamento"
            required
            value={recetaForm.medicamento}
            onChange={e => setRecetaForm(r => ({ ...r, medicamento: e.target.value }))}
            placeholder="Ej.: Amoxicilina 500 mg"
          />
          <Input
            label="Dosis"
            required
            value={recetaForm.dosis}
            onChange={e => setRecetaForm(r => ({ ...r, dosis: e.target.value }))}
            placeholder="Ej.: 1 comprimido cada 8 hs"
          />
          <Textarea
            label="Indicación"
            required
            value={recetaForm.indicacion}
            onChange={e => setRecetaForm(r => ({ ...r, indicacion: e.target.value }))}
            rows={3}
            placeholder="Instrucciones de uso…"
          />
          <Input
            label="Válido hasta"
            hint="Opcional"
            type="date"
            value={recetaForm.validoHasta}
            onChange={e => setRecetaForm(r => ({ ...r, validoHasta: e.target.value }))}
          />
          {recetaError && (
            <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium">
              <IconAlert className="shrink-0" />
              {recetaError}
            </div>
          )}
        </div>
      </Dialog>
    </PageTransition>
  );
}
