import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiError } from '../../lib/apiError';
import { AuthLayout } from './AuthLayout';
import { Input, PasswordInput, Button } from '../../ui';
import { IconCalendar, IconDoc, IconFolder, IconAlert, IconArrowRight } from '../../ui/icons';

const FEATURES = [
  { icon: <IconCalendar />, title: 'Turnos con médicos',  desc: 'Elegí especialidad, médico y horario' },
  { icon: <IconDoc />,      title: 'Recetas digitales',   desc: 'Accedé a tus recetas cuando quieras' },
  { icon: <IconFolder />,   title: 'Estudios médicos',    desc: 'Subí y consultá tus estudios' },
];

export default function Register() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', email: '', telefono: '', password: '' });
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/paciente/inicio', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Error al registrarse'));
    }
  };

  return (
    <AuthLayout
      headline={<>Tu salud empieza <em className="not-italic text-brand-300">acá</em>.</>}
      tagline="Creá tu cuenta en un minuto y gestioná turnos, recetas y estudios desde cualquier lugar."
      features={FEATURES}
    >
      <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Crear cuenta</h2>
      <p className="text-sm text-slate-500 mt-1.5 mb-8">Completá tus datos para registrarte.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" required value={form.nombre} onChange={set('nombre')} placeholder="Juan" autoComplete="given-name" />
          <Input label="Apellido" required value={form.apellido} onChange={set('apellido')} placeholder="Pérez" autoComplete="family-name" />
        </div>
        <Input label="DNI" required value={form.dni} onChange={set('dni')} placeholder="12345678" inputMode="numeric" />
        <Input label="Email" type="email" required value={form.email} onChange={set('email')} placeholder="tu@email.com" autoComplete="email" />
        <Input label="Teléfono" type="tel" value={form.telefono} onChange={set('telefono')} placeholder="11 1234-5678" hint="Opcional" autoComplete="tel" />
        <PasswordInput label="Contraseña" required value={form.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />

        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium">
                <IconAlert className="shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" size="lg" loading={isLoading} className="w-full" iconRight={<IconArrowRight />}>
          Crear cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
          Ingresar
        </Link>
      </p>
    </AuthLayout>
  );
}
