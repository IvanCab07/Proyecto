import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useAuthStore } from '../../store/useAuthStore';
import { useActualizarPerfil, useCambiarPassword } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { SeguridadCard } from '../../components/SeguridadCard';
import { Card, Button, Dialog, Input, PasswordInput, PageHeader } from '../../ui';
import {
  IconEdit, IconKey, IconAlert, IconIdCard, IconPhone, IconShield, IconLogout,
  IconUsers, IconStethoscope, IconTag, IconChart, IconChevronRight, IconCalendar,
} from '../../ui/icons';
import { iniciales } from '../../lib/format';
import {
  LIMITES, limpiar, sinError, formatearTelefono,
  validarNombre, validarTelefono, validarPassword, validarConfirmacion,
} from '../../lib/validaciones';

const QUICK_LINKS = [
  { to: '/admin/turnos', label: 'Turnos', desc: 'Agenda del hospital', icon: <IconCalendar /> },
  { to: '/admin/usuarios', label: 'Usuarios', desc: 'Cuentas y roles', icon: <IconShield /> },
  { to: '/admin/medicos', label: 'Médicos', desc: 'Altas y disponibilidad', icon: <IconStethoscope /> },
  { to: '/admin/especialidades', label: 'Especialidades', desc: 'Catálogo médico', icon: <IconTag /> },
  { to: '/admin/reportes', label: 'Reportes', desc: 'Estadísticas', icon: <IconChart /> },
];

export default function AdminAjustes() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const actualizarPerfil = useActualizarPerfil();
  const cambiarPassword = useCambiarPassword();

  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalPwd, setModalPwd] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nombre: '', apellido: '', telefono: '' });
  const [pwdForm, setPwdForm] = useState({ passwordActual: '', passwordNueva: '', confirm: '' });
  const [perfilError, setPerfilError] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Valida un campo del perfil y guarda (o limpia) su mensaje de error
  const validarCampo = (campo: keyof typeof perfilForm, valor: string) => {
    const msg =
      campo === 'nombre' ? validarNombre(valor, 'El nombre')
      : campo === 'apellido' ? validarNombre(valor, 'El apellido')
      : validarTelefono(valor);
    setErrores(e => (msg ? { ...sinError(e, campo), [campo]: msg } : sinError(e, campo)));
    return msg;
  };

  const setCampo = (campo: keyof typeof perfilForm) => (valor: string) => {
    setPerfilForm(p => ({ ...p, [campo]: valor }));
    // Al escribir se limpia el error del campo; se vuelve a validar en el blur
    setErrores(e => sinError(e, campo));
  };

  const abrirPerfil = () => {
    setPerfilForm({ nombre: user?.nombre ?? '', apellido: user?.apellido ?? '', telefono: user?.telefono ?? '' });
    setPerfilError('');
    setErrores({});
    setModalPerfil(true);
  };
  const abrirPwd = () => {
    setPwdForm({ passwordActual: '', passwordNueva: '', confirm: '' });
    setPwdError('');
    setModalPwd(true);
  };

  const handlePerfil = async (e: FormEvent) => {
    e.preventDefault();
    setPerfilError('');

    const nuevos: Record<string, string> = {};
    const nombre = validarNombre(perfilForm.nombre, 'El nombre');
    const apellido = validarNombre(perfilForm.apellido, 'El apellido');
    const telefono = validarTelefono(perfilForm.telefono);
    if (nombre) nuevos.nombre = nombre;
    if (apellido) nuevos.apellido = apellido;
    if (telefono) nuevos.telefono = telefono;
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    try {
      await actualizarPerfil.mutateAsync({
        nombre: limpiar(perfilForm.nombre),
        apellido: limpiar(perfilForm.apellido),
        telefono: perfilForm.telefono.trim() || undefined,
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
    const msg = validarPassword(pwdForm.passwordNueva)
      ?? validarConfirmacion(pwdForm.passwordNueva, pwdForm.confirm);
    if (msg) return setPwdError(msg);
    try {
      await cambiarPassword.mutateAsync({ passwordActual: pwdForm.passwordActual, passwordNueva: pwdForm.passwordNueva });
      toast.success('Contraseña actualizada');
      setModalPwd(false);
    } catch (err) {
      setPwdError(apiError(err, 'Error al cambiar la contraseña'));
    }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const rows = [
    { label: 'DNI', value: user?.dni || '—', icon: <IconIdCard /> },
    { label: 'Teléfono', value: user?.telefono || 'No registrado', icon: <IconPhone /> },
    { label: 'Rol', value: 'Administrador', icon: <IconShield /> },
  ];

  return (
    <PageTransition>
      <PageHeader title="Ajustes" description="Tu cuenta y seguridad." />

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {/* Cuenta */}
        <Card className="overflow-hidden lg:row-span-2">
          <div className="gradient-card h-20" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-8">
              <div className="w-16 h-16 rounded-2xl bg-mint-grad text-rail grid place-items-center font-bold text-2xl select-none shrink-0 ring-4 ring-surface shadow-glow-mint">
                {iniciales(user?.nombre, user?.apellido)}
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-rail text-rail-fg mb-1">Admin</span>
            </div>
            <p className="font-bold text-slate-900 text-lg tracking-tightish leading-tight truncate mt-3">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>

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

        {/* Tu cuenta */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><IconShield className="w-4 h-4 text-slate-400" /> Tu cuenta</h3>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" size="sm" iconLeft={<IconEdit />} onClick={abrirPerfil}>Editar datos</Button>
            <Button variant="secondary" size="sm" iconLeft={<IconKey />} onClick={abrirPwd}>Cambiar contraseña</Button>
            <Button variant="secondary" size="sm" iconLeft={<IconLogout />} onClick={handleLogout}>Cerrar sesión</Button>
          </div>
        </Card>

        {/* Seguridad: verificación de email + 2FA */}
        <div className="lg:col-span-2">
          <SeguridadCard />
        </div>

        {/* Accesos rápidos */}
        <Card className="p-5 lg:col-span-3">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><IconUsers className="w-4 h-4 text-slate-400" /> Accesos rápidos</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {QUICK_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="group flex items-center gap-3 rounded-field ring-1 ring-inset ring-slate-100 hover:ring-brand-200 hover:bg-brand-50/40 px-3.5 py-3 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0 [&>svg]:w-4 [&>svg]:h-4">{l.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{l.label}</span>
                  <span className="block text-xs text-slate-400 truncate">{l.desc}</span>
                </span>
                <IconChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={modalPerfil} onClose={() => setModalPerfil(false)} title="Editar datos">
        <form onSubmit={handlePerfil} className="space-y-4">
          <Input
            label="Nombre"
            required
            maxLength={LIMITES.nombre}
            value={perfilForm.nombre}
            error={errores.nombre}
            onChange={e => setCampo('nombre')(e.target.value)}
            onBlur={e => validarCampo('nombre', e.target.value)}
          />
          <Input
            label="Apellido"
            required
            maxLength={LIMITES.apellido}
            value={perfilForm.apellido}
            error={errores.apellido}
            onChange={e => setCampo('apellido')(e.target.value)}
            onBlur={e => validarCampo('apellido', e.target.value)}
          />
          <Input
            label="Teléfono"
            type="tel"
            hint="Opcional"
            placeholder="11 1234-5678"
            maxLength={LIMITES.telefono}
            value={perfilForm.telefono}
            error={errores.telefono}
            onChange={e => setCampo('telefono')(formatearTelefono(e.target.value))}
            onBlur={e => validarCampo('telefono', e.target.value)}
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
        <form onSubmit={handlePwd} className="space-y-4">
          <PasswordInput label="Contraseña actual" required autoComplete="current-password" value={pwdForm.passwordActual} onChange={e => setPwdForm(p => ({ ...p, passwordActual: e.target.value }))} />
          <PasswordInput label="Nueva contraseña" required autoComplete="new-password" maxLength={LIMITES.password} hint={`Mínimo ${LIMITES.passwordMin} caracteres`} value={pwdForm.passwordNueva} onChange={e => setPwdForm(p => ({ ...p, passwordNueva: e.target.value }))} />
          <PasswordInput label="Confirmar nueva contraseña" required autoComplete="new-password" maxLength={LIMITES.password} value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} />
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
