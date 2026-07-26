import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services';
import { apiError } from '../../lib/apiError';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthLayout } from './AuthLayout';
import { Spinner } from '../../ui';
import { IconAlert, IconCheckCircle } from '../../ui/icons';

type Estado = 'verificando' | 'ok' | 'error';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const loadUser = useAuthStore(s => s.loadUser);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const [estado, setEstado] = useState<Estado>('verificando');
  const [error, setError] = useState('');
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return; // evita doble ejecución en StrictMode (el token es de un solo uso)
    ranOnce.current = true;

    if (!token) {
      setEstado('error');
      setError('Falta el código de verificación en el enlace.');
      return;
    }
    authService.verifyEmail(token)
      .then(() => {
        setEstado('ok');
        if (isAuthenticated) loadUser(); // refresca el estado emailVerified si hay sesión
      })
      .catch(err => {
        setEstado('error');
        setError(apiError(err, 'No se pudo verificar el email'));
      });
  }, [token, isAuthenticated, loadUser]);

  return (
    <AuthLayout
      headline={<>Tu cuenta, <em className="not-italic text-brand-300">verificada</em>.</>}
      tagline="Confirmamos tu dirección de email para mantener tu cuenta segura."
      image="register"
    >
      <div className="text-center">
        {estado === 'verificando' && (
          <>
            <span className="mx-auto mb-5 grid place-items-center"><Spinner size={32} /></span>
            <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Verificando…</h2>
            <p className="text-sm text-slate-500 mt-2">Esto toma solo un segundo.</p>
          </>
        )}

        {estado === 'ok' && (
          <>
            <span className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-success-soft text-success-text grid place-items-center [&>svg]:w-7 [&>svg]:h-7">
              <IconCheckCircle />
            </span>
            <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">¡Email verificado!</h2>
            <p className="text-sm text-slate-500 mt-2">Tu cuenta quedó confirmada. Ya podés usar la plataforma.</p>
            <Link to="/login" className="inline-block mt-8 font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
              Continuar
            </Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <span className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-danger-soft text-danger-text grid place-items-center [&>svg]:w-7 [&>svg]:h-7">
              <IconAlert />
            </span>
            <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">No pudimos verificar</h2>
            <p className="text-sm text-slate-500 mt-2">{error}</p>
            <p className="text-sm text-slate-500 mt-1">Iniciá sesión y reenviá el email de verificación desde tu perfil.</p>
            <Link to="/login" className="inline-block mt-8 font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2">
              Ir a iniciar sesión
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
