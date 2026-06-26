import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiError } from '../../lib/apiError';
import { homePath } from '../../lib/nav';
import { AuthLayout, AUTH_FEATURES } from './AuthLayout';
import { Input, Button } from '../../ui';
import { IconAlert, IconArrowRight, IconShield } from '../../ui/icons';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const challenge = (location.state as { challenge?: string } | null)?.challenge;
  const { completeTwoFactor, isLoading } = useAuthStore();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // Sin challenge no se puede completar el 2do paso → volver al login
  if (!challenge) return <Navigate to="/login" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) return setError('Ingresá el código de 6 dígitos de tu app.');
    try {
      await completeTwoFactor(challenge, code);
      const role = useAuthStore.getState().user?.role;
      navigate(homePath(role), { replace: true });
    } catch (err) {
      setError(apiError(err, 'El código no es válido'));
    }
  };

  return (
    <AuthLayout
      headline={<>Un paso <em className="not-italic text-brand-300">más</em>.</>}
      tagline="Tu cuenta está protegida con verificación en dos pasos. Ingresá el código de tu app autenticadora."
      features={AUTH_FEATURES}
    >
      <span className="mb-5 w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center [&>svg]:w-6 [&>svg]:h-6">
        <IconShield />
      </span>
      <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Verificación en dos pasos</h2>
      <p className="text-sm text-slate-500 mt-1.5 mb-8">Abrí tu app autenticadora (Google Authenticator, Authy…) e ingresá el código de 6 dígitos.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Código de verificación"
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
        />

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
          Verificar e ingresar
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
