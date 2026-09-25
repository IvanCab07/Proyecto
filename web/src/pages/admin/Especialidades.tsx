import { useState } from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useEspecialidades, useCrearEspecialidad, useActualizarEspecialidad, useEliminarEspecialidad } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, ConfirmDialog, Input, PageHeader, EmptyState, Menu, Skeleton, StatCard,
} from '../../ui';
import { IconPlus, IconTag, IconEdit, IconTrash, IconDots, IconStethoscope, IconAlert, IconUsers } from '../../ui/icons';
import { listContainer, listItem } from '../../lib/motion';
import { LIMITES, limpiar, normalizar, validarEspecialidad } from '../../lib/validaciones';
import type { Especialidad } from '../../services';

export default function AdminEspecialidades() {
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [nombre, setNombre] = useState('');
  const [editando, setEditando] = useState<Especialidad | null>(null);
  const [eliminando, setEliminando] = useState<Especialidad | null>(null);
  const [error, setError] = useState('');
  const [errorNombre, setErrorNombre] = useState('');

  const { data: especialidades, isLoading } = useEspecialidades();
  const crear = useCrearEspecialidad();
  const actualizar = useActualizarEspecialidad();
  const eliminar = useEliminarEspecialidad();

  // Limpiar `editando` importa: el chequeo de duplicados lo usa para excluir la fila en edición
  const openCrear = () => {
    setEditando(null); setNombre(''); setError(''); setErrorNombre(''); setModal('crear');
  };
  const openEditar = (e: Especialidad) => {
    setEditando(e); setNombre(e.nombre); setError(''); setErrorNombre(''); setModal('editar');
  };

  // Formato + duplicado contra el catálogo ya cargado (ignora el que se está editando).
  // "Cardiología" y "cardiologia" cuentan como la misma.
  const validarNombreEsp = (valor: string): string => {
    const formato = validarEspecialidad(valor);
    if (formato) return formato;
    const repetida = (especialidades ?? []).some(
      e => e.id !== editando?.id && normalizar(e.nombre) === normalizar(valor),
    );
    return repetida ? 'Ya existe una especialidad con ese nombre' : '';
  };

  const handleGuardar = async () => {
    const msg = validarNombreEsp(nombre);
    setErrorNombre(msg);
    if (msg) return;
    setError('');
    try {
      if (modal === 'crear') {
        await crear.mutateAsync(limpiar(nombre));
        toast.success('Especialidad creada');
      } else if (editando) {
        await actualizar.mutateAsync({ id: editando.id, nombre: limpiar(nombre) });
        toast.success('Especialidad actualizada');
      }
      setModal(null);
    } catch (e) {
      setError(apiError(e, 'Error al guardar'));
    }
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    try {
      await eliminar.mutateAsync(eliminando.id);
      toast.success('Especialidad eliminada');
      setEliminando(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo eliminar la especialidad'));
    }
  };

  const isPending = crear.isPending || actualizar.isPending;
  const total = especialidades?.length ?? 0;
  const totalMedicos = (especialidades ?? []).reduce((acc, e) => acc + (e._count?.medicos ?? 0), 0);

  return (
    <PageTransition>
      <PageHeader
        title="Especialidades"
        description={total === 1 ? '1 especialidad registrada' : `${total} especialidades registradas`}
        actions={
          <Button iconLeft={<IconPlus />} onClick={openCrear}>
            Nueva especialidad
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-10 w-10 rounded-xl mb-4" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </Card>
          ))}
        </div>
      ) : !especialidades?.length ? (
        <Card>
          <EmptyState
            icon={<IconTag />}
            title="Sin especialidades"
            description="Creá la primera especialidad para poder cargar médicos."
            action={
              <Button iconLeft={<IconPlus />} onClick={openCrear}>
                Nueva especialidad
              </Button>
            }
          />
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <StatCard label="Especialidades" value={total} icon={<IconTag />} tone="brand" />
          <StatCard label="Médicos asignados" value={totalMedicos} icon={<IconUsers />} tone="accent" />
        </div>
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {especialidades.map(e => (
            <motion.div key={e.id} variants={listItem}>
              <Card className="p-5 h-full transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center [&>svg]:w-5 [&>svg]:h-5">
                    <IconStethoscope />
                  </div>
                  <Menu
                    trigger={<IconDots />}
                    triggerLabel={`Acciones para ${e.nombre}`}
                    items={[
                      { label: 'Editar', icon: <IconEdit />, onSelect: () => openEditar(e) },
                      { label: 'Eliminar', icon: <IconTrash />, tone: 'danger', onSelect: () => setEliminando(e) },
                    ]}
                  />
                </div>
                <p className="font-semibold text-slate-900 leading-tight">{e.nombre}</p>
                {e._count !== undefined && (
                  <p className="text-[13px] text-slate-500 mt-1">
                    {e._count.medicos} {e._count.medicos === 1 ? 'médico' : 'médicos'}
                  </p>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
        </>
      )}

      <Dialog
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nueva especialidad' : 'Editar especialidad'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={isPending}>
              {modal === 'crear' ? 'Crear' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            required
            value={nombre}
            error={errorNombre}
            maxLength={LIMITES.especialidad}
            onChange={e => { setNombre(e.target.value); setErrorNombre(''); }}
            onBlur={e => setErrorNombre(validarNombreEsp(e.target.value))}
            autoFocus
            placeholder="Ej.: Cardiología"
            onKeyDown={e => e.key === 'Enter' && handleGuardar()}
          />
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
        title="Eliminar especialidad"
        message={eliminando ? `Vas a eliminar “${eliminando.nombre}”. Esta acción no se puede deshacer.` : undefined}
        confirmLabel="Eliminar"
        tone="danger"
        loading={eliminar.isPending}
      />
    </PageTransition>
  );
}
