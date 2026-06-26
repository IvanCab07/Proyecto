import { useState } from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useTodosMedicos, useEspecialidades, useCrearMedico, useActualizarMedico, useEliminarMedico } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, ConfirmDialog, Input, Select, PageHeader,
  EmptyState, SkeletonTable, Menu,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconPlus, IconStethoscope, IconEdit, IconTrash, IconDots, IconAlert } from '../../ui/icons';
import { SPRING } from '../../lib/motion';
import { cn } from '../../lib/cn';
import type { Medico } from '../../services';

const EMPTY_FORM = { nombre: '', apellido: '', matricula: '', especialidadId: '' };

function DisponibleSwitch({ checked, onChange, disabled }: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Marcar como no disponible' : 'Marcar como disponible'}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'w-9 h-5 rounded-pill p-0.5 flex transition-colors duration-200 disabled:opacity-50',
        checked ? 'bg-success justify-end' : 'bg-slate-300 justify-start',
      )}
    >
      <motion.span layout transition={SPRING.snappy} className="w-4 h-4 rounded-full bg-white shadow-xs" />
    </button>
  );
}

export default function AdminMedicos() {
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editando, setEditando] = useState<Medico | null>(null);
  const [eliminando, setEliminando] = useState<Medico | null>(null);
  const [error, setError] = useState('');

  const { data: medicos, isLoading } = useTodosMedicos();
  const { data: especialidades } = useEspecialidades();
  const crear = useCrearMedico();
  const actualizar = useActualizarMedico();
  const eliminar = useEliminarMedico();

  const openCrear = () => { setForm(EMPTY_FORM); setError(''); setModal('crear'); };
  const openEditar = (m: Medico) => {
    setEditando(m);
    setForm({ nombre: m.nombre, apellido: m.apellido, matricula: m.matricula, especialidadId: m.especialidad.id });
    setError('');
    setModal('editar');
  };

  const handleGuardar = async () => {
    if (!form.nombre || !form.apellido || !form.matricula || !form.especialidadId) {
      return setError('Todos los campos son obligatorios');
    }
    setError('');
    try {
      if (modal === 'crear') {
        await crear.mutateAsync(form);
        toast.success('Médico creado correctamente');
      } else if (editando) {
        await actualizar.mutateAsync({ id: editando.id, nombre: form.nombre, apellido: form.apellido });
        toast.success('Médico actualizado');
      }
      setModal(null);
    } catch (e) {
      setError(apiError(e, 'Error al guardar'));
    }
  };

  const handleToggleDisponible = async (m: Medico) => {
    try {
      await actualizar.mutateAsync({ id: m.id, disponible: !m.disponible });
      toast.success(m.disponible ? 'Médico marcado como no disponible' : 'Médico disponible nuevamente');
    } catch {
      toast.error('No se pudo actualizar la disponibilidad');
    }
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    try {
      await eliminar.mutateAsync(eliminando.id);
      toast.success('Médico eliminado');
      setEliminando(null);
    } catch {
      toast.error('No se pudo eliminar el médico');
    }
  };

  const isPending = crear.isPending || actualizar.isPending;
  const total = medicos?.length ?? 0;
  const disponibles = medicos?.filter(m => m.disponible).length ?? 0;

  return (
    <PageTransition>
      <PageHeader
        title="Médicos"
        description={
          total === 0
            ? 'Todavía no hay médicos cargados.'
            : `${total} en total · ${disponibles} ${disponibles === 1 ? 'disponible' : 'disponibles'}`
        }
        actions={
          <Button iconLeft={<IconPlus />} onClick={openCrear}>
            Nuevo médico
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : !medicos?.length ? (
        <Card>
          <EmptyState
            icon={<IconStethoscope />}
            title="Sin médicos"
            description="Cargá el primer médico para que los pacientes puedan solicitar turnos."
            action={
              <Button iconLeft={<IconPlus />} onClick={openCrear}>
                Nuevo médico
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TH>Médico</TH>
              <TH>Matrícula</TH>
              <TH>Especialidad</TH>
              <TH>Disponible</TH>
              <TH />
            </THead>
            <TBody>
              {medicos.map(m => (
                <TR key={m.id}>
                  <TD className="font-medium text-slate-900 whitespace-nowrap">
                    Dr. {m.nombre} {m.apellido}
                  </TD>
                  <TD className="tnum text-slate-500">{m.matricula}</TD>
                  <TD>
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium whitespace-nowrap">
                      {m.especialidad.nombre}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <DisponibleSwitch
                        checked={m.disponible}
                        disabled={actualizar.isPending}
                        onChange={() => handleToggleDisponible(m)}
                      />
                      <span className={cn('text-xs font-medium', m.disponible ? 'text-success-text' : 'text-slate-400')}>
                        {m.disponible ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </TD>
                  <TD className="text-right">
                    <Menu
                      trigger={<IconDots />}
                      triggerLabel={`Acciones para Dr. ${m.apellido}`}
                      items={[
                        { label: 'Editar', icon: <IconEdit />, onSelect: () => openEditar(m) },
                        { label: 'Eliminar', icon: <IconTrash />, tone: 'danger', onSelect: () => setEliminando(m) },
                      ]}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Dialog
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nuevo médico' : 'Editar médico'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={isPending}>
              {modal === 'crear' ? 'Crear médico' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" required autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <Input label="Apellido" required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
          </div>
          <Input
            label="Matrícula"
            required
            value={form.matricula}
            onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))}
            disabled={modal === 'editar'}
            hint={modal === 'editar' ? 'La matrícula no se puede modificar' : undefined}
          />
          {modal === 'crear' && (
            <Select
              label="Especialidad"
              required
              value={form.especialidadId}
              onChange={e => setForm(f => ({ ...f, especialidadId: e.target.value }))}
            >
              <option value="">Seleccionar especialidad</option>
              {especialidades?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </Select>
          )}
          {error && (
            <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium">
              <IconAlert className="shrink-0" />
              {error}
            </div>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!eliminando}
        onClose={() => setEliminando(null)}
        onConfirm={handleEliminar}
        title="Eliminar médico"
        message={eliminando ? `Vas a eliminar a Dr. ${eliminando.nombre} ${eliminando.apellido}. Esta acción no se puede deshacer.` : undefined}
        confirmLabel="Eliminar"
        tone="danger"
        loading={eliminar.isPending}
      />
    </PageTransition>
  );
}
