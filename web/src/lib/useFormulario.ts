import { useState } from 'react';
import { sinError } from './validaciones';

// Estado de un formulario validado campo por campo.
//
// El patrón salió de admin/Usuarios.tsx, donde estaba escrito a mano: valores + mapa de
// errores, se valida al salir del campo (onBlur), el error se limpia mientras se corrige, y
// al enviar se barren todos los campos de una. Estaba copiado en cuatro pantallas del panel
// y faltaba por completo en las de auth y perfil, que era donde más hacía falta.
//
// `reglas` es un objeto con un validador por campo; cada uno devuelve el mensaje de error o
// undefined, igual que los de lib/validaciones.ts. Los campos sin regla no se validan.

type Valores = Record<string, string>;

/** Un validador recibe el valor del campo y todos los valores, por si depende de otro. */
type Regla<T extends Valores> = (valor: string, valores: T) => string | undefined;

export type Reglas<T extends Valores> = Partial<Record<keyof T, Regla<T>>>;

export function useFormulario<T extends Valores>(iniciales: T | (() => T), reglas: Reglas<T>) {
  const [valores, setValores] = useState<T>(iniciales);
  const [errores, setErrores] = useState<Partial<Record<keyof T, string>>>({});

  const validar = (campo: keyof T, valores: T) => reglas[campo]?.(valores[campo], valores);

  /** onChange: guarda el valor y borra el error del campo para no dejarlo en rojo al corregir. */
  const setCampo = (campo: keyof T, valor: string) => {
    setValores(v => ({ ...v, [campo]: valor }));
    setErrores(e => sinError(e as Record<string, string>, campo as string) as typeof e);
  };

  /** onBlur: recién acá se muestra el error, para no avisar mientras todavía está escribiendo. */
  const marcarCampo = (campo: keyof T) => {
    setValores(v => {
      const msg = validar(campo, v);
      setErrores(e => (msg
        ? { ...e, [campo]: msg }
        : sinError(e as Record<string, string>, campo as string) as typeof e));
      return v;
    });
  };

  /**
   * Valida todo antes de enviar y devuelve si quedó limpio. Los errores se muestran todos
   * juntos, así el usuario ve de una qué le falta en vez de descubrirlo campo por campo.
   */
  const validarTodo = (): boolean => {
    const nuevos: Partial<Record<keyof T, string>> = {};
    for (const campo of Object.keys(reglas) as (keyof T)[]) {
      const msg = validar(campo, valores);
      if (msg) nuevos[campo] = msg;
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  /** Vuelve al estado inicial. Para reabrir un modal sin arrastrar lo anterior. */
  const reiniciar = (nuevos?: T) => {
    setValores(nuevos ?? (typeof iniciales === 'function' ? iniciales() : iniciales));
    setErrores({});
  };

  /**
   * Props listas para `<Input>`, `<Select>` o `<Textarea>`: value, onChange, onBlur y error.
   *
   * El onChange toma la unión de los tres elementos porque un handler que acepta más tipos
   * de los que le van a llegar sigue siendo válido donde se espera uno más específico. Si
   * estuviera tipado solo para HTMLInputElement, spreadearlo en un <Textarea> no compila.
   */
  const campo = (nombre: keyof T) => ({
    value: valores[nombre],
    error: errores[nombre],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setCampo(nombre, e.target.value),
    onBlur: () => marcarCampo(nombre),
  });

  return { valores, errores, campo, setCampo, marcarCampo, validarTodo, reiniciar };
}
