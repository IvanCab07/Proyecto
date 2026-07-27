import { useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useAuthStore } from '../../store/useAuthStore';
import {
  useActualizarPerfil, useCambiarPassword, useMisTurnos, useMisRecetas, useMisEstudios,
} from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { SeguridadCard } from '../../components/SeguridadCard';
import { Card, Button, Dialog, Input, PasswordInput, PageHeader, StatCard } from '../../ui';
import { FotoPerfil } from '../../components/FotoPerfil';
import {
  IconEdit, IconKey, IconAlert, IconIdCard, IconPhone, IconMail,
  IconCalendar, IconPill, IconFolder,
} from '../../ui/icons';
import { estadoReceta } from '../../lib/fechas';
import { useFormulario } from '../../lib/useFormulario';
import {
  LIMITES, limpiar, formatearTelefono,
  validarNombre, validarTelefono, validarPassword, validarConfirmacion,
} from '../../lib/validaciones';

// Acá NO va una grilla de accesos rápidos: la misma lista ya está en el menú lateral y en
// Inicio. Esta pantalla es sobre los datos de la cuenta, y repetir el menú una tercera vez
// empujaba la tarjeta de seguridad abajo de todo.

export default function PacientePerfil() {
  const { user } = useAuthStore();
  const actualizarPerfil = useActualizarPerfil();
  const cambiarPassword = useCambiarPassword();
  const { data: turnos } = useMisTurnos();
  const { data: recetas } = useMisRecetas();
  const { data: estudios } = useMisEstudios();

  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalPwd, setModalPwd] = useState(false);
  const [perfilError, setPerfilError] = useState('');
  const [pwdError, setPwdError] = useState('');

  const perfil = useFormulario(
    { nombre: '', apellido: '', telefono: '' },
    {
      nombre:   v => validarNombre(v, 'El nombre'),
      apellido: v => validarNombre(v, 'El apellido'),
      telefono: validarTelefono,
    },
  );

  const pwd = useFormulario(
    { passwordActual: '', passwordNueva: '', confirm: '' },
    {
      passwordActual: v => (v ? undefined : 'Ingresá tu contraseña actual'),
      passwordNueva:  validarPassword,
      confirm:        (v, todos) => validarConfirmacion(todos.passwordNueva, v),
    },
  );

  const today = new Date().toISOString().slice(0, 10);
  const proximos = (turnos ?? []).filter(
    t => t.fecha.slice(0, 10) >= today && (t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'),
  ).length;
  const completados = (turnos ?? []).filter(t => t.status === 'COMPLETADO').length;
  const recetasVigentes = (recetas ?? []).filter(r => estadoReceta(r.validoHasta) !== 'vencida').length;

  const abrirPerfil = () => {
    perfil.reiniciar({
      nombre: user?.nombre ?? '', apellido: user?.apellido ?? '', telefono: user?.telefono ?? '',
    });
    setPerfilError('');
    setModalPerfil(true);
  };

  const abrirPwd = () => {
    pwd.reiniciar();
    setPwdError('');
    setModalPwd(true);
  };

  const handlePerfil = async (e: FormEvent) => {
    e.preventDefault();
    setPerfilError('');
    if (!perfil.validarTodo()) return;

    try {
      await actualizarPerfil.mutateAsync({
        nombre: limpiar(perfil.valores.nombre),
        apellido: limpiar(perfil.valores.apellido),
        telefono: perfil.valores.telefono.trim() || undefined,
      });
      toast.success('Datos actualizados');
      setModalPerfil(false);
    } catch (err) {
      setPerfilError(apiError(err, 'Error al actualizar'));
    }
  };

  const handlePwd = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (!pwd.validarTodo()) return;

    try {
      await cambiarPassword.mutateAsync({
        passwordActual: pwd.valores.passwordActual,
        passwordNueva: pwd.valores.passwordNueva,
      });
      toast.success('Contraseña actualizada');
      setModalPwd(false);
    } catch (err) {
      setPwdError(apiError(err, 'Error al cambiar la contraseña'));
    }
  };

  const rows = [
    { label: 'DNI', value: user?.dni || '—', icon: <IconIdCard /> },
    { label: 'Teléfono', value: user?.telefono || 'No registrado', icon: <IconPhone /> },
    { label: 'Email', value: user?.email || '—', icon: <IconMail /> },
  ];

  return (
    <PageTransition>
      <PageHeader title="Mi perfil" description="Tus datos personales y de acceso." />

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {/* Tarjeta de cuenta */}
        <Card className="overflow-hidden lg:row-span-2">
          <div className="gradient-card h-20" />
          <div className="px-6 pb-6">
            <FotoPerfil etiquetaRol="Paciente" />
            <p className="font-bold text-slate-900 text-lg tracking-tightish leading-tight truncate mt-3">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>

            <div className="flex flex-wrap gap-2.5 mt-5">
              <Button variant="secondary" size="sm" iconLeft={<IconEdit />} onClick={abrirPerfil}>
                Editar datos
              </Button>
              <Button variant="secondary" size="sm" iconLeft={<IconKey />} onClick={abrirPwd}>
                Cambiar contraseña
              </Button>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {rows.map(row => (
                <div key={row.label} className="flex items-center gap-3 py-3 text-sm">
                  <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 grid place-items-center shrink-0 [&>svg]:w-4 [&>svg]:h-4">
                    {row.icon}
                  </span>
                  <span className="text-slate-500 flex-1">{row.label}</span>
                  <span className="text-slate-900 font-medium text-right truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Resumen */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Turnos próximos" value={proximos} icon={<IconCalendar />} tone="brand" />
          <StatCard label="Completados" value={completados} icon={<IconCalendar />} tone="success" />
          <StatCard label="Recetas vigentes" value={recetasVigentes} icon={<IconPill />} tone="accent" />
          <StatCard label="Estudios" value={estudios?.length ?? 0} icon={<IconFolder />} tone="warning" />
        </div>

        <div className="lg:col-span-2">
          <SeguridadCard />
        </div>
      </div>

      <Dialog open={modalPerfil} onClose={() => setModalPerfil(false)} title="Editar datos">
        <form onSubmit={handlePerfil} className="space-y-4" noValidate>
          <Input label="Nombre" required maxLength={LIMITES.nombre} {...perfil.campo('nombre')} />
          <Input label="Apellido" required maxLength={LIMITES.apellido} {...perfil.campo('apellido')} />
          <Input
            label="Teléfono"
            type="tel"
            hint="Opcional"
            maxLength={LIMITES.telefono}
            placeholder="11 1234-5678"
            {...perfil.campo('telefono')}
            // Se descartan las letras al tipear, igual que en el registro.
            onChange={e => perfil.setCampo('telefono', formatearTelefono(e.target.value))}
          />
          {perfilError && (
            <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium">
              <IconAlert className="shrink-0" />
              {perfilError}
            </div>
          )}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalPerfil(false)}>Cancelar</Button>
            <Button type="submit" loading={actualizarPerfil.isPending}>Guardar</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={modalPwd} onClose={() => setModalPwd(false)} title="Cambiar contraseña">
        <form onSubmit={handlePwd} className="space-y-4" noValidate>
          <PasswordInput label="Contraseña actual" required autoComplete="current-password" maxLength={LIMITES.password} {...pwd.campo('passwordActual')} />
          <PasswordInput label="Nueva contraseña" required autoComplete="new-password" maxLength={LIMITES.password} hint={`Mínimo ${LIMITES.passwordMin} caracteres`} {...pwd.campo('passwordNueva')} />
          <PasswordInput label="Confirmar nueva contraseña" required autoComplete="new-password" maxLength={LIMITES.password} {...pwd.campo('confirm')} />
          {pwdError && (
            <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium">
              <IconAlert className="shrink-0" />
              {pwdError}
            </div>
          )}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalPwd(false)}>Cancelar</Button>
            <Button type="submit" loading={cambiarPassword.isPending}>Cambiar contraseña</Button>
          </div>
        </form>
      </Dialog>
    </PageTransition>
  );
}
