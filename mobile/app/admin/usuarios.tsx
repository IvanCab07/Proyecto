import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import {
  useCuentas, useEspecialidades, useCrearUsuario, useActualizarUsuario, useResetPassword, useEliminarUsuario,
} from '../../hooks';
import { useAuthStore } from '../../store/useAuthStore';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, ConfirmDialog, Input, PasswordInput, Select, SearchInput, PageHeader,
  EmptyState, SkeletonTable, Menu, Tabs, Avatar,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconPlus, IconUsers, IconEdit, IconTrash, IconDots, IconKey, IconAlert, IconSparkle } from '../../ui/icons';
import { cn } from '../../lib/cn';
import type { Cuenta } from '../../services';

type RoleFilter = 'TODOS' | 'PATIENT' | 'MEDICO' | 'ADMIN';
const ROLE_LABEL: Record<string, string> = { PATIENT: 'Paciente', MEDICO: 'Médico', ADMIN: 'Admin' };
const ROLE_TONE: Record<string, string> = {
  PATIENT: 'bg-info-soft text-info-text',
  MEDICO: 'bg-brand-100 text-brand-800',
  ADMIN: 'bg-slate-900 text-white',
};

const EMPTY_FORM = {
  email: '', password: '', nombre: '', apellido: '', dni: '', telefono: '',
  role: 'PATIENT' as 'PATIENT' | 'MEDICO' | 'ADMIN', matricula: '', especialidadId: '',
};

export default function AdminUsuarios() {
  const yo = useAuthStore(s => s.user);
  const [tab, setTab] = useState<RoleFilter>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editando, setEditando] = useState<Cuenta | null>(null);
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState<Cuenta | null>(null);
  const [nuevaPass, setNuevaPass] = useState('');
  const [eliminando, setEliminando] = useState<Cuenta | null>(null);

  const role = tab === 'TODOS' ? undefined : tab;
  const { data: cuentas, isLoading } = useCuentas(role);
  const { data: especialidades } = useEspecialidades();
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();
  const reset = useResetPassword();
  const eliminar = useEliminarUsuario();

  const filtradas = useMemo(
    () => (cuentas ?? []).filter(c =>
      `${c.nombre} ${c.apellido} ${c.email} ${c.dni}`.toLowerCase().includes(busqueda.toLowerCase())),
    [cuentas, busqueda],
  );

  const openCrear = () => { setForm(EMPTY_FORM); setError(''); setModal('crear'); };
  const openEditar = (c: Cuenta) => {
    setEditando(c);
    setForm({ ...EMPTY_FORM, nombre: c.nombre, apellido: c.apellido, telefono: c.telefono ?? '', role: c.role });
    setError('');
    setModal('editar');
  };

  const handleGuardar = async () => {
    if (modal === 'crear') {
      if (!form.email || !form.password || !form.nombre || !form.apellido || !form.dni) {
        return setError('Completá email, contraseña, nombre, apellido y DNI');
      }
      if (form.role === 'MEDICO' && (!form.matricula || !form.especialidadId)) {
        return setError('Un médico necesita matrícula y especialidad');
      }
    }
    setError('');
    try {
      if (modal === 'crear') {
        await crear.mutateAsync({
          email: form.email, password: form.password, nombre: form.nombre, apellido: form.apellido,
          dni: form.dni, telefono: form.telefono || undefined, role: form.role,
          ...(form.role === 'MEDICO' ? { matricula: form.matricula, especialidadId: form.especialidadId } : {}),
        });
        toast.success('Cuenta creada');
      } else if (editando) {
        await actualizar.mutateAsync({
          id: editando.id, nombre: form.nombre, apellido: form.apellido,
          telefono: form.telefono || undefined, role: form.role,
        });
        toast.success('Cuenta actualizada');
      }
      setModal(null);
    } catch (e) {
      setError(apiError(e, 'No se pudo guardar'));
    }
  };

  const handleToggleActivo = async (c: Cuenta) => {
    try {
      await actualizar.mutateAsync({ id: c.id, activo: !c.activo });
      toast.success(c.activo ? 'Cuenta desactivada' : 'Cuenta activada');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo cambiar el estado'));
    }
  };

  const handleTogglePuedeCalificar = async (c: Cuenta) => {
    try {
      await actualizar.mutateAsync({ id: c.id, puedeCalificar: !c.puedeCalificar });
      toast.success(c.puedeCalificar ? 'Calificaciones bloqueadas para este paciente' : 'Calificaciones habilitadas');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo cambiar el permiso'));
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    if (nuevaPass.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    try {
      await reset.mutateAsync({ id: resetTarget.id, password: nuevaPass });
      toast.success(`Contraseña de ${resetTarget.nombre} actualizada`);
      setResetTarget(null); setNuevaPass('');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo resetear la contraseña'));
    }
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    try {
      await eliminar.mutateAsync(eliminando.id);
      toast.success('Cuenta eliminada');
      setEliminando(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo eliminar'));
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Usuarios"
        description="Gestioná las cuentas de pacientes, médicos y administradores."
        actions={<Button iconLeft={<IconPlus />} onClick={openCrear}>Nuevo usuario</Button>}
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={v => setTab(v as RoleFilter)}
        tabs={[
          { id: 'TODOS', label: 'Todos' },
          { id: 'PATIENT', label: 'Pacientes' },
          { id: 'MEDICO', label: 'Médicos' },
          { id: 'ADMIN', label: 'Admins' },
        ]}
      />

      <SearchInput
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, email o DNI…"
        className="max-w-md mb-4"
      />

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : !filtradas.length ? (
        <Card>
          <EmptyState
            icon={<IconUsers />}
            title={busqueda ? 'Sin resultados' : 'Sin cuentas'}
            description={busqueda ? `Ninguna cuenta coincide con “${busqueda}”.` : 'Creá la primera cuenta con el botón “Nuevo usuario”.'}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TH>Usuario</TH>
              <TH>Email</TH>
              <TH>DNI</TH>
              <TH>Rol</TH>
              <TH>Estado</TH>
              <TH />
            </THead>
            <TBody>
              {filtradas.map(c => {
                const esYo = c.id === yo?.id;
                return (
                  <TR key={c.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm" nombre={c.nombre} apellido={c.apellido} />
                        <span className="font-medium text-slate-900 whitespace-nowrap">
                          {c.nombre} {c.apellido}
                          {c.medico ? <span className="text-slate-400 font-normal"> · Mat. {c.medico.matricula}</span> : null}
                          {c.role === 'PATIENT' && !c.puedeCalificar ? <span className="text-amber-600 font-normal"> · sin calificar</span> : null}
                        </span>
                      </div>
                    </TD>
                    <TD>{c.email}</TD>
                    <TD className="tnum">{c.dni}</TD>
                    <TD>
                      <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap', ROLE_TONE[c.role])}>
                        {ROLE_LABEL[c.role]}
                      </span>
                    </TD>
                    <TD>
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', c.activo ? 'text-success-text' : 'text-slate-400')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', c.activo ? 'bg-success' : 'bg-slate-300')} />
                        {c.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <Menu
                        trigger={<IconDots />}
                        triggerLabel={`Acciones para ${c.nombre}`}
                        items={[
                          { label: 'Editar', icon: <IconEdit />, onSelect: () => openEditar(c) },
                          { label: 'Resetear contraseña', icon: <IconKey />, onSelect: () => { setResetTarget(c); setNuevaPass(''); } },
                          ...(c.role === 'PATIENT'
                            ? [{ label: c.puedeCalificar ? 'Bloquear calificaciones' : 'Permitir calificar', icon: <IconSparkle />, onSelect: () => handleTogglePuedeCalificar(c) }]
                            : []),
                          ...(esYo ? [] : [{ label: c.activo ? 'Desactivar' : 'Activar', icon: <IconUsers />, onSelect: () => handleToggleActivo(c) }]),
                          ...(esYo ? [] : [{ label: 'Eliminar', icon: <IconTrash />, tone: 'danger' as const, onSelect: () => setEliminando(c) }]),
                        ]}
                      />
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      {/* Crear / Editar */}
      <Dialog
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={crear.isPending || actualizar.isPending}>
              {modal === 'crear' ? 'Crear cuenta' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" required autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <Input label="Apellido" required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
          </div>
          {modal === 'crear' && (
            <>
              <Input label="Email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="DNI" required value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} />
                <PasswordInput label="Contraseña" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} hint="Mínimo 6" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" hint="Opcional" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            <Select label="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof f.role }))}>
              <option value="PATIENT">Paciente</option>
              <option value="MEDICO">Médico</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </div>
          {modal === 'crear' && form.role === 'MEDICO' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Matrícula" required value={form.matricula} onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))} />
              <Select label="Especialidad" required value={form.especialidadId} onChange={e => setForm(f => ({ ...f, especialidadId: e.target.value }))}>
                <option value="">Seleccionar…</option>
                {especialidades?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </Select>
            </div>
          )}
          {modal === 'editar' && editando?.role === 'MEDICO' && form.role !== 'MEDICO' && (
            <p className="text-[13px] text-slate-400">Esta cuenta tiene ficha de médico vinculada.</p>
          )}
          {error && (
            <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium">
              <IconAlert className="shrink-0" />
              {error}
            </div>
          )}
        </div>
      </Dialog>

      {/* Resetear contraseña */}
      <Dialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Resetear contraseña"
        description={resetTarget ? `Nueva contraseña para ${resetTarget.nombre} ${resetTarget.apellido}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetTarget(null)}>Cancelar</Button>
            <Button onClick={handleReset} loading={reset.isPending}>Guardar contraseña</Button>
          </>
        }
      >
        <PasswordInput label="Nueva contraseña" value={nuevaPass} onChange={e => setNuevaPass(e.target.value)} hint="Mínimo 6 caracteres" autoComplete="new-password" />
      </Dialog>

      <ConfirmDialog
        open={!!eliminando}
        onClose={() => setEliminando(null)}
        onConfirm={handleEliminar}
        title="Eliminar cuenta"
        message={eliminando ? `Vas a eliminar la cuenta de ${eliminando.nombre} ${eliminando.apellido}. Esta acción no se puede deshacer.` : undefined}
        confirmLabel="Eliminar"
        tone="danger"
        loading={eliminar.isPending}
      />
    </PageTransition>
  );
}
