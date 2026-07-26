import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import {
  useCuentas, useEspecialidades, useCrearUsuario, useActualizarUsuario, useResetPassword, useEliminarUsuario,
} from '../../hooks';
import { useAuthStore } from '../../store/useAuthStore';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, ConfirmDialog, Input, PasswordInput, Select, Textarea, SearchInput, PageHeader,
  EmptyState, SkeletonTable, Menu, Tabs, Avatar,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import {
  IconPlus, IconUsers, IconEdit, IconTrash, IconDots, IconKey, IconAlert, IconSparkle, IconShield,
} from '../../ui/icons';
import { cn } from '../../lib/cn';
import {
  LIMITES, limpiar, sinError, formatearMatricula, formatearDni, formatearTelefono,
  validarNombre, validarTelefono, validarDni, validarEmail, validarPassword, validarMatricula,
} from '../../lib/validaciones';
import type { Cuenta } from '../../services';

type Role = 'PATIENT' | 'MEDICO' | 'ADMIN';
type RoleFilter = 'TODOS' | Role;
const ROLE_LABEL: Record<string, string> = { PATIENT: 'Paciente', MEDICO: 'Médico', ADMIN: 'Admin' };
const ROLE_TONE: Record<string, string> = {
  PATIENT: 'bg-info-soft text-info-text',
  MEDICO: 'bg-brand-100 text-brand-800',
  ADMIN: 'bg-rail text-rail-fg',
};

// Qué puede hacer cada rol, para explicarlo al cambiarlo
const ROLE_DESC: Record<Role, string> = {
  PATIENT: 'Pide turnos, ve sus recetas y estudios.',
  MEDICO:  'Atiende su agenda y emite recetas.',
  ADMIN:   'Acceso total al panel de administración.',
};

const EMPTY_FORM = {
  email: '', password: '', nombre: '', apellido: '', dni: '', telefono: '',
  role: 'PATIENT' as Role, matricula: '', especialidadId: '',
};

export default function AdminUsuarios() {
  const yo = useAuthStore(s => s.user);
  const [tab, setTab] = useState<RoleFilter>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editando, setEditando] = useState<Cuenta | null>(null);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [resetTarget, setResetTarget] = useState<Cuenta | null>(null);
  const [nuevaPass, setNuevaPass] = useState('');
  const [eliminando, setEliminando] = useState<Cuenta | null>(null);
  const [cambiandoRol, setCambiandoRol] = useState<Cuenta | null>(null);
  const [rolElegido, setRolElegido] = useState<Role | ''>('');
  const [desactivando, setDesactivando] = useState<Cuenta | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');

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

  const openCrear = () => { setForm(EMPTY_FORM); setError(''); setErrores({}); setModal('crear'); };
  const openEditar = (c: Cuenta) => {
    setEditando(c);
    setForm({ ...EMPTY_FORM, nombre: c.nombre, apellido: c.apellido, telefono: c.telefono ?? '', role: c.role });
    setError('');
    setErrores({});
    setModal('editar');
  };

  const editandoseASiMismo = modal === 'editar' && editando?.id === yo?.id;

  // Valida un campo del formulario. Los campos que solo existen al crear (email,
  // contraseña, DNI, matrícula) no se validan en el modo editar.
  const validarCampo = (campo: keyof typeof form, valor: string): string | undefined => {
    switch (campo) {
      case 'nombre':    return validarNombre(valor, 'El nombre');
      case 'apellido':  return validarNombre(valor, 'El apellido');
      case 'telefono':  return validarTelefono(valor);
      case 'email':     return modal === 'crear' ? validarEmail(valor) : undefined;
      case 'password':  return modal === 'crear' ? validarPassword(valor) : undefined;
      case 'dni':       return modal === 'crear' ? validarDni(valor) : undefined;
      case 'matricula': return modal === 'crear' && form.role === 'MEDICO' ? validarMatricula(valor) : undefined;
      default:          return undefined;
    }
  };

  const marcarCampo = (campo: keyof typeof form, valor: string) => {
    const msg = validarCampo(campo, valor);
    setErrores(e => (msg ? { ...sinError(e, campo), [campo]: msg } : sinError(e, campo)));
  };

  const setCampo = (campo: keyof typeof form, valor: string) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErrores(e => sinError(e, campo));
  };

  const handleGuardar = async () => {
    const campos: (keyof typeof form)[] = ['nombre', 'apellido', 'telefono', 'email', 'password', 'dni', 'matricula'];
    const nuevos: Record<string, string> = {};
    for (const campo of campos) {
      const msg = validarCampo(campo, form[campo]);
      if (msg) nuevos[campo] = msg;
    }
    if (modal === 'crear' && form.role === 'MEDICO' && !form.especialidadId) {
      nuevos.especialidadId = 'Elegí una especialidad';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setError('');
    try {
      if (modal === 'crear') {
        await crear.mutateAsync({
          email: form.email.trim(), password: form.password,
          nombre: limpiar(form.nombre), apellido: limpiar(form.apellido),
          dni: form.dni.trim(), telefono: form.telefono.trim() || undefined, role: form.role,
          ...(form.role === 'MEDICO'
            ? { matricula: form.matricula.trim().toUpperCase(), especialidadId: form.especialidadId }
            : {}),
        });
        toast.success('Cuenta creada');
      } else if (editando) {
        await actualizar.mutateAsync({
          id: editando.id, nombre: limpiar(form.nombre), apellido: limpiar(form.apellido),
          telefono: form.telefono.trim() || undefined,
          // El rol propio no se toca: el Select está deshabilitado en ese caso
          ...(editandoseASiMismo ? {} : { role: form.role }),
        });
        toast.success('Cuenta actualizada');
      }
      setModal(null);
    } catch (e) {
      setError(apiError(e, 'No se pudo guardar'));
    }
  };

  const handleCambiarRol = async () => {
    if (!cambiandoRol || !rolElegido) return;
    try {
      await actualizar.mutateAsync({ id: cambiandoRol.id, role: rolElegido });
      toast.success(`${cambiandoRol.nombre} ahora es ${ROLE_LABEL[rolElegido].toLowerCase()}`);
      setCambiandoRol(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo cambiar el rol'));
    }
  };

  const handleDesactivar = async () => {
    if (!desactivando) return;
    try {
      await actualizar.mutateAsync({
        id: desactivando.id, activo: false, motivoBaja: motivoBaja.trim() || undefined,
      });
      toast.success('Cuenta dada de baja');
      setDesactivando(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo dar de baja la cuenta'));
    }
  };

  // Reactivar no es destructivo: se hace directo, sin confirmación
  const handleActivar = async (c: Cuenta) => {
    try {
      await actualizar.mutateAsync({ id: c.id, activo: true });
      toast.success('Cuenta reactivada');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo activar la cuenta'));
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
    const msg = validarPassword(nuevaPass);
    if (msg) return toast.error(msg);
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
                        {c.activo ? 'Activa' : 'De baja'}
                      </span>
                      {!c.activo && c.motivoBaja ? (
                        <span className="block text-[11px] text-slate-400 mt-0.5 max-w-[18ch] truncate" title={c.motivoBaja}>
                          {c.motivoBaja}
                        </span>
                      ) : null}
                    </TD>
                    <TD className="text-right">
                      <Menu
                        trigger={<IconDots />}
                        triggerLabel={`Acciones para ${c.nombre}`}
                        items={[
                          { label: 'Editar', icon: <IconEdit />, onSelect: () => openEditar(c) },
                          // El rol propio no se cambia: sacarse admin dejaría el panel sin acceso
                          ...(esYo ? [] : [{ label: 'Cambiar rol', icon: <IconShield />, onSelect: () => { setCambiandoRol(c); setRolElegido(c.role); } }]),
                          { label: 'Resetear contraseña', icon: <IconKey />, onSelect: () => { setResetTarget(c); setNuevaPass(''); } },
                          ...(c.role === 'PATIENT'
                            ? [{ label: c.puedeCalificar ? 'Bloquear calificaciones' : 'Permitir calificar', icon: <IconSparkle />, onSelect: () => handleTogglePuedeCalificar(c) }]
                            : []),
                          ...(esYo
                            ? []
                            : [c.activo
                                ? { label: 'Dar de baja', icon: <IconUsers />, onSelect: () => { setDesactivando(c); setMotivoBaja(''); } }
                                : { label: 'Reactivar', icon: <IconUsers />, onSelect: () => handleActivar(c) }]),
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
            <Input
              label="Nombre" required autoFocus maxLength={LIMITES.nombre}
              value={form.nombre} error={errores.nombre}
              onChange={e => setCampo('nombre', e.target.value)}
              onBlur={e => marcarCampo('nombre', e.target.value)}
            />
            <Input
              label="Apellido" required maxLength={LIMITES.apellido}
              value={form.apellido} error={errores.apellido}
              onChange={e => setCampo('apellido', e.target.value)}
              onBlur={e => marcarCampo('apellido', e.target.value)}
            />
          </div>
          {modal === 'crear' && (
            <>
              <Input
                label="Email" type="email" required maxLength={LIMITES.email}
                value={form.email} error={errores.email}
                onChange={e => setCampo('email', e.target.value)}
                onBlur={e => marcarCampo('email', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="DNI" required inputMode="numeric" maxLength={LIMITES.dni}
                  value={form.dni} error={errores.dni}
                  // Se descartan los no-dígitos al tipear, igual que en el registro
                  onChange={e => setCampo('dni', formatearDni(e.target.value))}
                  onBlur={e => marcarCampo('dni', e.target.value)}
                />
                <PasswordInput
                  label="Contraseña" required maxLength={LIMITES.password}
                  hint={`Mínimo ${LIMITES.passwordMin} caracteres`}
                  value={form.password} error={errores.password}
                  onChange={e => setCampo('password', e.target.value)}
                  onBlur={e => marcarCampo('password', e.target.value)}
                />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Teléfono" type="tel" hint="Opcional" placeholder="11 1234-5678" maxLength={LIMITES.telefono}
              value={form.telefono} error={errores.telefono}
              onChange={e => setCampo('telefono', formatearTelefono(e.target.value))}
              onBlur={e => marcarCampo('telefono', e.target.value)}
            />
            <Select
              label="Rol"
              value={form.role}
              disabled={editandoseASiMismo}
              hint={editandoseASiMismo ? 'No podés cambiar tu propio rol' : undefined}
              onChange={e => setCampo('role', e.target.value)}
            >
              <option value="PATIENT">Paciente</option>
              <option value="MEDICO">Médico</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </div>
          {modal === 'crear' && form.role === 'MEDICO' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Matrícula" required placeholder="Ej.: MP-12345" maxLength={LIMITES.matricula}
                value={form.matricula} error={errores.matricula}
                onChange={e => setCampo('matricula', formatearMatricula(e.target.value))}
                onBlur={e => marcarCampo('matricula', e.target.value)}
              />
              <Select
                label="Especialidad" required
                value={form.especialidadId} error={errores.especialidadId}
                onChange={e => setCampo('especialidadId', e.target.value)}
              >
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
        <PasswordInput
          label="Nueva contraseña"
          value={nuevaPass}
          onChange={e => setNuevaPass(e.target.value)}
          maxLength={LIMITES.password}
          hint={`Mínimo ${LIMITES.passwordMin} caracteres`}
          autoComplete="new-password"
        />
      </Dialog>

      {/* Cambiar rol */}
      <Dialog
        open={!!cambiandoRol}
        onClose={() => setCambiandoRol(null)}
        title="Cambiar rol"
        description={cambiandoRol ? `${cambiandoRol.nombre} ${cambiandoRol.apellido} · ${cambiandoRol.email}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCambiandoRol(null)}>Cancelar</Button>
            <Button
              onClick={handleCambiarRol}
              loading={actualizar.isPending}
              disabled={!rolElegido || rolElegido === cambiandoRol?.role}
            >
              Guardar rol
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {(['PATIENT', 'MEDICO', 'ADMIN'] as Role[]).map(r => {
            // Pasar a médico exige una ficha con matrícula y especialidad (se crea desde "Nuevo médico")
            const sinFicha = r === 'MEDICO' && !cambiandoRol?.medico;
            const activo = rolElegido === r;
            return (
              <button
                key={r}
                type="button"
                disabled={sinFicha}
                onClick={() => setRolElegido(r)}
                className={cn(
                  'w-full text-left rounded-field px-3.5 py-3 ring-1 ring-inset transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  activo ? 'bg-brand-50 ring-brand-500' : 'bg-surface ring-slate-200 hover:ring-brand-300',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{ROLE_LABEL[r]}</span>
                  {r === cambiandoRol?.role && (
                    <span className="text-[11px] font-medium text-slate-400">actual</span>
                  )}
                </span>
                <span className="block text-[13px] text-slate-500 mt-0.5">
                  {sinFicha ? 'Necesita una ficha de médico: creala desde “Médicos”.' : ROLE_DESC[r]}
                </span>
              </button>
            );
          })}
        </div>
      </Dialog>

      {/* Dar de baja */}
      <ConfirmDialog
        open={!!desactivando}
        onClose={() => setDesactivando(null)}
        onConfirm={handleDesactivar}
        title="Dar de baja la cuenta"
        message={desactivando
          ? `${desactivando.nombre} ${desactivando.apellido} no va a poder iniciar sesión. Su historial de turnos, recetas y estudios se conserva, y podés reactivarla cuando quieras.`
          : undefined}
        confirmLabel="Dar de baja"
        tone="danger"
        loading={actualizar.isPending}
      >
        <div className="mt-4">
          <Textarea
            label="Motivo"
            hint="Opcional. Queda registrado junto a la cuenta."
            rows={2}
            maxLength={200}
            value={motivoBaja}
            onChange={e => setMotivoBaja(e.target.value)}
          />
        </div>
      </ConfirmDialog>

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
