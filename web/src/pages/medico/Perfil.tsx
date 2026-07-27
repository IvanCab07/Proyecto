import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useAuthStore } from '../../store/useAuthStore';
import {
  useActualizarPerfil, useCambiarPassword, useMiAgenda, useRecetasMedico,
  useMiFichaMedico, useActualizarMiDisponibilidad,
} from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { SeguridadCard } from '../../components/SeguridadCard';
import { Card, Button, Dialog, Input, PasswordInput, PageHeader, StatCard, AlertInline } from '../../ui';
import { FotoPerfil } from '../../components/FotoPerfil';
import {
  IconEdit, IconKey, IconIdCard, IconPhone, IconShield,
  IconCalendar, IconCheckCircle, IconPill, IconArrowRight, IconStethoscope,
} from '../../ui/icons';
import { useFormulario } from '../../lib/useFormulario';
import {
  LIMITES, limpiar, formatearTelefono,
  validarNombre, validarTelefono, validarPassword, validarConfirmacion,
} from '../../lib/validaciones';

const ACCESOS = [
  { label: 'Mi agenda', desc: 'Turnos y diagnósticos', icon: <IconCalendar />, to: '/medico/agenda' },
  { label: 'Recetas',   desc: 'Emití y consultá',      icon: <IconPill />, to: '/medico/recetas' },
];

function DisponibleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Marcarme como no disponible' : 'Marcarme como disponible'}
      disabled={disabled}
      onClick={onChange}
      className={`w-11 h-6 rounded-pill p-0.5 flex items-center transition-colors duration-200 disabled:opacity-50 ${checked ? 'bg-success justify-end' : 'bg-slate-300 justify-start'}`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
    </button>
  );
}

export default function MedicoPerfil() {
  const { user } = useAuthStore();
  const actualizarPerfil = useActualizarPerfil();
  const cambiarPassword = useCambiarPassword();
  const { data: agenda } = useMiAgenda();
  const { data: recetas } = useRecetasMedico();
  const { data: ficha } = useMiFichaMedico();
  const toggleDisponible = useActualizarMiDisponibilidad();

  const disponible = ficha?.disponible ?? false;
  const handleToggleDisponible = async () => {
    try {
      await toggleDisponible.mutateAsync(!disponible);
      toast.success(!disponible ? 'Quedaste disponible para nuevos turnos' : 'Te marcaste como no disponible');
    } catch {
      toast.error('No se pudo actualizar la disponibilidad');
    }
  };

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
  const proximos = (agenda ?? []).filter(
    t => t.fecha.slice(0, 10) >= today && (t.status === 'PENDIENTE' || t.status === 'CONFIRMADO'),
  ).length;
  const completados = (agenda ?? []).filter(t => t.status === 'COMPLETADO').length;

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
    { label: 'Matrícula', value: ficha?.matricula || '—', icon: <IconIdCard /> },
    { label: 'Especialidad', value: ficha?.especialidad?.nombre || '—', icon: <IconStethoscope /> },
    { label: 'Teléfono', value: user?.telefono || 'No registrado', icon: <IconPhone /> },
    { label: 'Rol', value: 'Médico', icon: <IconShield /> },
  ];

  return (
    <PageTransition>
      <PageHeader title="Mi perfil" description="Tu cuenta de médico." />

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {/* Tarjeta de cuenta */}
        <Card className="overflow-hidden lg:row-span-2">
          <div className="gradient-card h-20" />
          <div className="px-6 pb-6">
            <FotoPerfil etiquetaRol="Médico" />
            <p className="font-bold text-slate-900 text-lg tracking-tightish leading-tight truncate mt-3">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>

            <div className="flex flex-wrap gap-2.5 mt-5">
              <Button variant="secondary" size="sm" iconLeft={<IconEdit />} onClick={abrirPerfil}>Editar datos</Button>
              <Button variant="secondary" size="sm" iconLeft={<IconKey />} onClick={abrirPwd}>Cambiar contraseña</Button>
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
        <div className="lg:col-span-2 grid grid-cols-3 gap-3">
          <StatCard label="Turnos próximos" value={proximos} icon={<IconCalendar />} tone="brand" />
          <StatCard label="Completados" value={completados} icon={<IconCheckCircle />} tone="success" />
          <StatCard label="Recetas emitidas" value={recetas?.length ?? 0} icon={<IconPill />} tone="accent" />
        </div>

        {/* Disponibilidad */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 [&>svg]:w-5 [&>svg]:h-5 ${disponible ? 'bg-success-soft text-success-text' : 'bg-slate-100 text-slate-400'}`}>
                <IconStethoscope />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm">Disponibilidad para turnos</p>
                <p className="text-[13px] text-slate-500">
                  {disponible ? 'Los pacientes pueden solicitarte turnos.' : 'No aparecés disponible para nuevos turnos.'}
                </p>
              </div>
            </div>
            <DisponibleSwitch checked={disponible} disabled={toggleDisponible.isPending} onChange={handleToggleDisponible} />
          </div>
        </Card>

        {/* Accesos rápidos */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <IconArrowRight className="w-4 h-4 text-slate-400" /> Accesos rápidos
          </h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
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
            onChange={e => perfil.setCampo('telefono', formatearTelefono(e.target.value))}
          />
          {perfilError && <AlertInline>{perfilError}</AlertInline>}
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
          {pwdError && <AlertInline>{pwdError}</AlertInline>}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalPwd(false)}>Cancelar</Button>
            <Button type="submit" loading={cambiarPassword.isPending}>Cambiar contraseña</Button>
          </div>
        </form>
      </Dialog>
    </PageTransition>
  );
}
