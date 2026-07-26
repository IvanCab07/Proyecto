import { cn } from '../lib/cn';
import { fuerzaPassword, LIMITES } from '../lib/validaciones';

/**
 * Medidor de fuerza de contraseña: tres barras y una etiqueta.
 *
 * Es solo una señal, no una validación: quien decide si la contraseña se acepta es
 * `validarPassword`, y el error correspondiente lo muestra el propio <PasswordInput>. Por eso
 * acá nunca se pinta un mensaje de error, solo el nivel alcanzado.
 *
 * Va debajo de los campos de contraseña NUEVA (registro, reset, cambio). En el login no
 * corresponde: ahí no se valida el formato para no dejar afuera a las cuentas viejas.
 */

const NIVELES = [
  { etiqueta: 'Muy corta', barra: 'bg-danger',  texto: 'text-danger-text' },
  { etiqueta: 'Débil',     barra: 'bg-danger',  texto: 'text-danger-text' },
  { etiqueta: 'Aceptable', barra: 'bg-warning', texto: 'text-warning-text' },
  { etiqueta: 'Fuerte',    barra: 'bg-success', texto: 'text-success-text' },
] as const;

export function PasswordStrength({ value, className }: { value: string; className?: string }) {
  // Sin nada escrito no hay nada que medir: mostrar "Muy corta" en un campo vacío sería
  // señalar un error que el usuario todavía no cometió.
  if (!value) return null;

  const nivel = fuerzaPassword(value);
  const { etiqueta, barra, texto } = NIVELES[nivel];

  return (
    <div className={cn('mt-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3].map(i => (
            <span
              key={i}
              className={cn(
                'h-1 flex-1 rounded-pill transition-colors duration-200',
                i <= nivel ? barra : 'bg-slate-200',
              )}
            />
          ))}
        </div>
        <span className={cn('text-[11px] font-semibold shrink-0', texto)}>{etiqueta}</span>
      </div>
      {nivel === 0 && (
        <p className="mt-1 text-[11px] text-slate-400">
          Mínimo {LIMITES.passwordMin} caracteres, con al menos una letra y un número.
        </p>
      )}
    </div>
  );
}
