import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../../services';
import { apiError } from '../../lib/apiError';
import { useFormulario } from '../../lib/useFormulario';
import { LIMITES, validarPassword, validarConfirmacion } from '../../lib/validaciones';
import { AuthLayout } from './AuthLayout';
import { PasswordInput, PasswordStrength, Button } from '../../ui';
import { IconAlert, IconArrowRight, IconCheckCircle } from '../../ui/icons';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const { valores, campo, validarTodo } = useFormulario(
    { password: '', confirm: '' },
    {
      password: validarPassword,
      confirm:  (v, todos) => validarConfirmacion(todos.password, v),
    },
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validarTodo()) return;

    setLoading(true);
    try {
      await authService.resetPassword(token, valores.password);
      setDone(true);
    } catch (err) {
      setError(apiError(err, 'No se pudo restablecer la contraseña'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline={<>Una contraseña <em className="not-italic text-brand-300">nueva</em>.</>}
      tagline="Elegí una contraseña segura para volver a entrar a tu cuenta."
      image="recovery"
    >
      {done ? (
        <div className="text-center">
          <span className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-success-soft text-success-text grid place-items-center [&>svg]:w-7 [&>svg]:h-7">
            <IconCheckCircle />
          </span>
          <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Listo</h2>
          <p className="text-sm text-slate-500 mt-2">Tu contraseña fue restablecida. Ya podés iniciar sesión.</p>
          <Link to="/login" className="inline-block mt-8 font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
            Ir a iniciar sesión
          </Link>
        </div>
      ) : !token ? (
        <div className="text-center">
          <span className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-danger-soft text-danger-text grid place-items-center [&>svg]:w-7 [&>svg]:h-7">
            <IconAlert />
          </span>
          <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Enlace inválido</h2>
          <p className="text-sm text-slate-500 mt-2">Falta el código del enlace. Pedí uno nuevo desde "Olvidé mi contraseña".</p>
          <Link to="/forgot-password" className="inline-block mt-8 font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
            Pedir un nuevo enlace
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Restablecer contraseña</h2>
          <p className="text-sm text-slate-500 mt-1.5 mb-8">Elegí tu nueva contraseña.</p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <PasswordInput
                label="Nueva contraseña"
                required
                autoFocus
                maxLength={LIMITES.password}
                autoComplete="new-password"
                hint={`Mínimo ${LIMITES.passwordMin} caracteres, con una letra y un número`}
                placeholder="••••••••"
                {...campo('password')}
              />
              <PasswordStrength value={valores.password} />
            </div>
            <PasswordInput
              label="Confirmar contraseña"
              required
              maxLength={LIMITES.password}
              autoComplete="new-password"
              placeholder="••••••••"
              {...campo('confirm')}
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
              Cambiar contraseña
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
