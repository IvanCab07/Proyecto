import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiError } from '../../lib/apiError';
import { homePath } from '../../lib/nav';
import { useFormulario } from '../../lib/useFormulario';
import { LIMITES, validarEmail } from '../../lib/validaciones';
import { AuthLayout } from './AuthLayout';
import { Input, PasswordInput, Button } from '../../ui';
import { IconAlert, IconArrowRight } from '../../ui/icons';

export default function Login() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Solo se valida el email. La contraseña no se valida de formato: una cuenta vieja puede
  // tener una que hoy no pasaría las reglas y no hay motivo para dejarla afuera del login.
  const { valores, campo, validarTodo } = useFormulario(
    { email: '', password: '' },
    { email: validarEmail },
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validarTodo()) return;

    try {
      // En minúsculas, igual que en el registro: así el mismo email entra escrito como sea.
      const result = await login(valores.email.trim().toLowerCase(), valores.password);
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
      image="login"
    >
      <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Bienvenido de nuevo</h2>
      <p className="text-sm text-slate-500 mt-1.5 mb-8">Ingresá tus credenciales para continuar.</p>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Email"
          type="email"
          required
          autoFocus
          maxLength={LIMITES.email}
          autoComplete="email"
          placeholder="tu@email.com"
          {...campo('email')}
        />
        <div>
          <PasswordInput
            label="Contraseña"
            required
            maxLength={LIMITES.password}
            autoComplete="current-password"
            placeholder="••••••••"
            {...campo('password')}
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
