import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../../services';
import { apiError } from '../../lib/apiError';
import { useFormulario } from '../../lib/useFormulario';
import { LIMITES, validarEmail } from '../../lib/validaciones';
import { AuthLayout } from './AuthLayout';
import { Input, Button } from '../../ui';
import { IconAlert, IconArrowRight, IconMail } from '../../ui/icons';

export default function ForgotPassword() {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { valores, campo, validarTodo } = useFormulario({ email: '' }, { email: validarEmail });
  const email = valores.email.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validarTodo()) return;

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(apiError(err, 'No se pudo procesar la solicitud'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline={<>Recuperá tu <em className="not-italic text-brand-300">acceso</em>.</>}
      tagline="Te enviamos un enlace seguro a tu email para que elijas una contraseña nueva."
      image="recovery"
    >
      {sent ? (
        <div className="text-center">
          <span className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-success-soft text-success-text grid place-items-center [&>svg]:w-7 [&>svg]:h-7">
            <IconMail />
          </span>
          <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Revisá tu correo</h2>
          <p className="text-sm text-slate-500 mt-2">
            Si <span className="font-medium text-slate-700">{email}</span> está registrado, te enviamos
            un enlace para restablecer tu contraseña. El enlace vence en 1 hora.
          </p>
          <Link to="/login" className="inline-block mt-8 font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">¿Olvidaste tu contraseña?</h2>
          <p className="text-sm text-slate-500 mt-1.5 mb-8">Ingresá tu email y te mandamos un enlace para recuperarla.</p>

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

            <Button type="submit" size="lg" loading={loading} className="w-full" iconRight={<IconArrowRight />}>
              Enviar enlace
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
              Volver a iniciar sesión
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
