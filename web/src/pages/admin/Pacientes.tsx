import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import {
  usePacientes, useHistorialPaciente, useMedicos, useCrearReceta,
} from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, Input, Select, Textarea, SearchInput, PageHeader,
  StatusBadge, EmptyState, SkeletonTable, Avatar, Tabs, Spinner,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconUsers, IconPlus, IconDoc, IconImage, IconAlert } from '../../ui/icons';
import { formatFecha } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { User, CreateRecetaDTO } from '../../services';

const EMPTY_RECETA = { medicoId: '', medicamento: '', dosis: '', indicacion: '', validoHasta: '' };

export default function AdminPacientes() {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<User | null>(null);
  const [tab, setTab] = useState('turnos');
  const [recetaModal, setRecetaModal] = useState(false);
  const [recetaForm, setRecetaForm] = useState(EMPTY_RECETA);
  const [recetaError, setRecetaError] = useState('');

  const { data: pacientes, isLoading } = usePacientes();
  const { data: historial, isLoading: histLoading } = useHistorialPaciente(seleccionado?.id ?? '');
  const { data: medicos } = useMedicos();
  const crearReceta = useCrearReceta();

  const filtrados = pacientes?.filter(p =>
    `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  ) ?? [];

  const handleOpenHistorial = (p: User) => {
    setSeleccionado(p);
    setTab('turnos');
  };

  const handleEmitirReceta = async () => {
    if (!recetaForm.medicoId || !recetaForm.medicamento || !recetaForm.dosis || !recetaForm.indicacion) {
      return setRecetaError('Médico, medicamento, dosis e indicación son obligatorios');
    }
    setRecetaError('');
    try {
      const dto: CreateRecetaDTO = {
        pacienteId: seleccionado!.id,
        medicoId: recetaForm.medicoId,
        medicamento: recetaForm.medicamento,
        dosis: recetaForm.dosis,
        indicacion: recetaForm.indicacion,
        validoHasta: recetaForm.validoHasta || undefined,
      };
      await crearReceta.mutateAsync(dto);
      toast.success('Receta emitida correctamente');
      setRecetaModal(false);
      setRecetaForm(EMPTY_RECETA);
    } catch (e) {
      setRecetaError(apiError(e, 'Error al emitir la receta'));
    }
  };

  const total = pacientes?.length ?? 0;

  return (
    <PageTransition>
      <PageHeader
        title="Pacientes"
        description={total === 1 ? '1 paciente registrado' : `${total} pacientes registrados`}
      />

      <SearchInput
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, apellido o DNI…"
        className="max-w-md mb-4"
      />

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : !filtrados.length ? (
        <Card>
          <EmptyState
            icon={<IconUsers />}
            title={busqueda ? 'Sin resultados' : 'Sin pacientes'}
            description={
              busqueda
                ? `Ningún paciente coincide con “${busqueda}”.`
                : 'Cuando los pacientes se registren van a aparecer acá.'
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TH>Paciente</TH>
              <TH>Email</TH>
              <TH>DNI</TH>
              <TH>Teléfono</TH>
              <TH />
            </THead>
            <TBody>
              {filtrados.map(p => (
                <TR key={p.id} interactive onClick={() => handleOpenHistorial(p)}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" nombre={p.nombre} apellido={p.apellido} />
                      <span className="font-medium text-slate-900 whitespace-nowrap">{p.nombre} {p.apellido}</span>
                    </div>
                  </TD>
                  <TD>{p.email}</TD>
                  <TD className="tnum">{p.dni}</TD>
                  <TD className="tnum">{p.telefono || '—'}</TD>
                  <TD className="text-right">
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleOpenHistorial(p); }}>
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
        description={seleccionado ? `${seleccionado.email} · DNI ${seleccionado.dni}` : undefined}
        size="lg"
      >
        {seleccionado && (
          <div>
            <Tabs
              className="mb-4"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'turnos',   label: 'Turnos',   count: historial?.turnos.length },
                { id: 'recetas',  label: 'Recetas',  count: historial?.recetas.length },
                { id: 'estudios', label: 'Estudios', count: historial?.estudios.length },
              ]}
            />

            {histLoading ? (
              <div className="min-h-[240px] grid place-items-center text-slate-400">
                <Spinner size={22} />
              </div>
            ) : historial ? (
              <div className="min-h-[240px]">
                {tab === 'turnos' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {historial.turnos.length === 0 ? (
                      <p className="text-sm text-slate-400 py-8 text-center">Sin turnos registrados.</p>
                    ) : historial.turnos.map(t => (
                      <div key={t.id} className="flex items-start justify-between gap-3 px-3.5 py-3 rounded-field ring-1 ring-inset ring-slate-100">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">Dr. {t.medico.nombre} {t.medico.apellido}</p>
                          <p className="text-[13px] text-slate-500 mt-0.5">
                            {t.medico.especialidad.nombre} · {formatFecha(t.fecha)} a las {t.hora}
                          </p>
                          {t.motivo && <p className="text-[13px] text-slate-400 italic mt-1">“{t.motivo}”</p>}
                          {t.diagnostico && (
                            <p className="text-[13px] mt-1.5 px-2.5 py-1.5 rounded-lg bg-success-soft text-success-text">
                              {t.diagnostico}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'recetas' && (
                  <div>
                    <div className="flex justify-end mb-3">
                      <Button
                        size="sm"
                        iconLeft={<IconPlus />}
                        onClick={() => { setRecetaForm(EMPTY_RECETA); setRecetaError(''); setRecetaModal(true); }}
                      >
                        Nueva receta
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {historial.recetas.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">Sin recetas emitidas.</p>
                      ) : historial.recetas.map(r => (
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

                {tab === 'estudios' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {historial.estudios.length === 0 ? (
                      <p className="text-sm text-slate-400 py-8 text-center">Sin estudios cargados.</p>
                    ) : historial.estudios.map(e => {
                      const isPdf = e.tipoArchivo?.toLowerCase() === 'application/pdf' ||
                        e.tipoArchivo?.toLowerCase() === 'pdf' ||
                        e.archivoUrl?.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={e.id} className="flex items-center gap-3 px-3.5 py-3 rounded-field ring-1 ring-inset ring-slate-100">
                          <div className={cn(
                            'w-9 h-9 rounded-lg grid place-items-center shrink-0',
                            isPdf ? 'bg-danger-soft text-danger-text' : 'bg-info-soft text-info-text',
                          )}>
                            {isPdf ? <IconDoc /> : <IconImage />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{e.titulo}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{formatFecha(e.fecha)} · {isPdf ? 'PDF' : 'Imagen'}</p>
                          </div>
                          {e.archivoUrl && (
                            <a
                              href={e.archivoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[13px] font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2 shrink-0"
                            >
                              Ver
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
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
          <Select
            label="Médico"
            required
            value={recetaForm.medicoId}
            onChange={e => setRecetaForm(f => ({ ...f, medicoId: e.target.value }))}
          >
            <option value="">Seleccionar médico</option>
            {medicos?.map(m => (
              <option key={m.id} value={m.id}>Dr. {m.nombre} {m.apellido} — {m.especialidad?.nombre}</option>
            ))}
          </Select>
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
