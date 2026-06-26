import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useAuthStore } from '../../store/useAuthStore';
import {
  useActualizarPerfil, useCambiarPassword, useMisTurnos, useMisRecetas, useMisEstudios,
} from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { SeguridadCard } from '../../components/SeguridadCard';
import { Card, Button, Dialog, Input, PasswordInput, PageHeader, StatCard } from '../../ui';
import {
  IconEdit, IconKey, IconAlert, IconIdCard, IconPhone, IconMail,
  IconCalendar, IconPill, IconFolder, IconPlus, IconMapPin, IconArrowRight,
} from '../../ui/icons';
import { iniciales } from '../../lib/format';

const ACCESOS = [
  { label: 'Solicitar turno', desc: 'Reservá con un médico', icon: <IconPlus />, to: '/paciente/solicitar' },
  { label: 'Mis turnos',      desc: 'Próximos e historial',  icon: <IconCalendar />, to: '/paciente/turnos' },
  { label: 'Recetas',         desc: 'Tus indicaciones',      icon: <IconPill />, to: '/paciente/recetas' },
  { label: 'Estudios',        desc: 'Subí y consultá',       icon: <IconFolder />, to: '/paciente/estudios' },
  { label: 'Centros y mapa',  desc: 'Cómo llegar',           icon: <IconMapPin />, to: '/paciente/mapa' },
];

export default function PacientePerfil() {
  const { user } = useAuthStore();
  const actualizarPerfil = useActualizarPerfil();
  const cambiarPassword = useCambiarPassword();
  const { data: turnos } = useMisTurnos();
  const { data: recetas } = useMisRecetas();
  const { data: estudios } = useMisEstudios();

  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalPwd, setModalPwd] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nombre: '', apellido: '', telefono: '' });
  const [pwdForm, setPwdForm] = useState({ passwordActual: '', passwordNueva: '', confirm: '' });
  const [perfilError, setPerfilError] = useState('');
  const [pwdError, setPwdError] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const proximos = (turnos ?? []).filter(
    t => t.fecha.slice(0, 10) >= today && (t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'),
  ).length;
  const completados = (turnos ?? []).filter(t => t.status === 'COMPLETADO').length;

  const abrirPerfil = () => {
    setPerfilForm({ nombre: user?.nombre ?? '', apellido: user?.apellido ?? '', telefono: user?.telefono ?? '' });
    setPerfilError('');
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
    try {
      await actualizarPerfil.mutateAsync({
        nombre: perfilForm.nombre,
        apellido: perfilForm.apellido,
        telefono: perfilForm.telefono || undefined,
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
    if (pwdForm.passwordNueva !== pwdForm.confirm) return setPwdError('Las contraseñas no coinciden');
    if (pwdForm.passwordNueva.length < 6) return setPwdError('La nueva contraseña debe tener al menos 6 caracteres');
    try {
      await cambiarPassword.mutateAsync({
        passwordActual: pwdForm.passwordActual,
        passwordNueva: pwdForm.passwordNueva,
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
          <div className="bg-rail bg-gradient-to-br from-[#0C2422] via-rail to-[#0A1615] h-20" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white grid place-items-center font-bold text-2xl select-none shrink-0 ring-4 ring-surface shadow-glow-brand">
                {iniciales(user?.nombre, user?.apellido)}
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-brand-100 text-brand-800 mb-1">
                Paciente
              </span>
            </div>
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
          <StatCard label="Recetas" value={recetas?.length ?? 0} icon={<IconPill />} tone="accent" />
          <StatCard label="Estudios" value={estudios?.length ?? 0} icon={<IconFolder />} tone="warning" />
        </div>

        {/* Accesos rápidos */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <IconArrowRight className="w-4 h-4 text-slate-400" /> Accesos rápidos
          </h3>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {ACCESOS.map(a => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-center gap-3 rounded-field ring-1 ring-inset ring-slate-100 hover:ring-brand-200 hover:bg-brand-50/40 px-3.5 py-3 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-colors [&>svg]:w-4 [&>svg]:h-4">
                  {a.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{a.label}</span>
                  <span className="block text-xs text-slate-400 truncate">{a.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3">
          <SeguridadCard />
        </div>
      </div>

      <Dialog open={modalPerfil} onClose={() => setModalPerfil(false)} title="Editar datos">
        <form onSubmit={handlePerfil} className="space-y-4">
          <Input label="Nombre" required value={perfilForm.nombre} onChange={e => setPerfilForm(p => ({ ...p, nombre: e.target.value }))} />
          <Input label="Apellido" required value={perfilForm.apellido} onChange={e => setPerfilForm(p => ({ ...p, apellido: e.target.value }))} />
          <Input label="Teléfono" hint="Opcional" value={perfilForm.telefono} onChange={e => setPerfilForm(p => ({ ...p, telefono: e.target.value }))} />
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
          <PasswordInput label="Nueva contraseña" required autoComplete="new-password" hint="Mínimo 6 caracteres" value={pwdForm.passwordNueva} onChange={e => setPwdForm(p => ({ ...p, passwordNueva: e.target.value }))} />
          <PasswordInput label="Confirmar nueva contraseña" required autoComplete="new-password" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} />
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
