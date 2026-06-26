import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiError } from '../../lib/apiError';
import { homePath } from '../../lib/nav';
import { AuthLayout } from './AuthLayout';
import { Input, PasswordInput, Button } from '../../ui';
import { IconCalendar, IconDoc, IconChart, IconAlert, IconArrowRight } from '../../ui/icons';

const FEATURES = [
  { icon: <IconCalendar />, title: 'Turnos digitales',   desc: 'Solicitá y gestioná tus turnos online' },
  { icon: <IconDoc />,      title: 'Recetas y estudios', desc: 'Tus documentos médicos, siempre a mano' },
  { icon: <IconChart />,    title: 'Reportes claros',    desc: 'Estadísticas actualizadas al instante' },
];

export default function Login() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(email, password);
      // Si la cuenta tiene 2FA, vamos al 2do paso con el challenge
      if ('twoFactorRequired' in result) {
        navigate('/verify-otp', { state: { challenge: result.challenge } });
        return;
      }
      const role = useAuthStore.getState().user?.role;
      navigate(homePath(role), { replace: true });
    } catch (err) {
      setError(apiError(err, 'Credenciales incorrectas'));
    }
  };

  return (
    <AuthLayout
      headline={<>La salud, <em className="not-italic text-brand-300">bien</em> atendida.</>}
      tagline="Todo lo que necesitás para cuidar tu salud, en un solo lugar: turnos, recetas y estudios sin filas ni papeles."
      features={FEATURES}
    >
      <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Bienvenido de nuevo</h2>
      <p className="text-sm text-slate-500 mt-1.5 mb-8">Ingresá tus credenciales para continuar.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />
        <div>
          <PasswordInput
            label="Contraseña"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="mt-1.5 text-right">
            <Link to="/forgot-password" className="text-[13px] font-medium text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

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
          Ingresar
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
          Registrate
        </Link>
      </p>
    </AuthLayout>
  );
}
