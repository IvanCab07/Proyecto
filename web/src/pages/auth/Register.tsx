import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiError } from '../../lib/apiError';
import { useFormulario } from '../../lib/useFormulario';
import {
  LIMITES, limpiar, formatearDni, formatearTelefono,
  validarNombre, validarDni, validarEmail, validarTelefono, validarPassword, validarConfirmacion,
} from '../../lib/validaciones';
import { AuthLayout } from './AuthLayout';
import { Input, PasswordInput, PasswordStrength, Button } from '../../ui';
import { IconAlert, IconArrowRight } from '../../ui/icons';

const INICIAL = {
  nombre: '', apellido: '', dni: '', email: '', telefono: '', password: '', confirm: '',
};

export default function Register() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { valores, campo, setCampo, validarTodo } = useFormulario(INICIAL, {
    nombre:   v => validarNombre(v, 'El nombre'),
    apellido: v => validarNombre(v, 'El apellido'),
    dni:      validarDni,
    email:    validarEmail,
    telefono: validarTelefono,
    password: validarPassword,
    confirm:  (v, todos) => validarConfirmacion(todos.password, v),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validarTodo()) return;

    try {
      await register({
        // Nombre y apellido van con los espacios de más colapsados: "Juan  Pérez " se guarda
        // como "Juan Pérez" y no genera duplicados que solo se diferencian por el espaciado.
        nombre:   limpiar(valores.nombre),
        apellido: limpiar(valores.apellido),
        dni:      valores.dni.trim(),
        // En minúsculas para que la tabla no termine con el mismo email escrito de dos formas.
        email:    valores.email.trim().toLowerCase(),
        telefono: valores.telefono.trim() || undefined,
        password: valores.password,
      });
      navigate('/paciente/inicio', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Error al registrarse'));
    }
  };

  return (
    <AuthLayout
      headline={<>Tu salud empieza <em className="not-italic text-brand-300">acá</em>.</>}
      tagline="Creá tu cuenta en un minuto y gestioná turnos, recetas y estudios desde cualquier lugar."
      image="register"
    >
      <h2 className="text-2xl font-bold tracking-tighter2 text-slate-900">Crear cuenta</h2>
      <p className="text-sm text-slate-500 mt-1.5 mb-8">Completá tus datos para registrarte.</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre"
            required
            maxLength={LIMITES.nombre}
            placeholder="Juan"
            autoComplete="given-name"
            {...campo('nombre')}
          />
          <Input
            label="Apellido"
            required
            maxLength={LIMITES.apellido}
            placeholder="Pérez"
            autoComplete="family-name"
            {...campo('apellido')}
          />
        </div>

        <Input
          label="DNI"
          required
          inputMode="numeric"
          maxLength={LIMITES.dni}
          placeholder="12345678"
          hint={`Entre ${LIMITES.dniMin} y ${LIMITES.dni} dígitos, sin puntos`}
          {...campo('dni')}
          // Se descartan los no-dígitos al tipear: es más claro que dejar escribir y
          // rechazar después, y evita que alguien lo cargue con puntos.
          onChange={e => setCampo('dni', formatearDni(e.target.value))}
        />

        <Input
          label="Email"
          type="email"
          required
          maxLength={LIMITES.email}
          placeholder="tu@email.com"
          autoComplete="email"
          {...campo('email')}
        />

        <Input
          label="Teléfono"
          type="tel"
          maxLength={LIMITES.telefono}
          placeholder="11 1234-5678"
          hint="Opcional"
          autoComplete="tel"
          {...campo('telefono')}
          // Igual que el DNI: se descartan las letras al tipear en vez de aceptarlas y
          // rechazarlas recién al salir del campo.
          onChange={e => setCampo('telefono', formatearTelefono(e.target.value))}
        />

        <div>
          <PasswordInput
            label="Contraseña"
            required
            maxLength={LIMITES.password}
            placeholder={`Mínimo ${LIMITES.passwordMin} caracteres`}
            autoComplete="new-password"
            {...campo('password')}
          />
          <PasswordStrength value={valores.password} />
        </div>

        <PasswordInput
          label="Repetir contraseña"
          required
          maxLength={LIMITES.password}
          placeholder="Escribila de nuevo"
          autoComplete="new-password"
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
