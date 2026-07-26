import { useState } from 'react';
import { Input, Select, Textarea, AlertInline } from '../../ui';
import { cn } from '../../lib/cn';
import { aISO, mananaISO, sumarDiasISO } from '../../lib/fechas';
import {
  limpiar, validarMedicamento, validarDosis, validarIndicacion, validarFechaValidez,
} from '../../lib/validaciones';
import type { CreateRecetaDTO, PacienteRef } from '../../services';

// Formulario único de emisión de recetas: lo usan la página de Recetas (eligiendo paciente)
// y el historial de Mis pacientes (con el paciente ya fijado).
//
// Antes cada pantalla tenía su copia y mandaban la fecha distinto: una convertía a ISO y la
// otra mandaba "YYYY-MM-DD" crudo, que el backend rechazaba con "La validez no es una fecha
// válida". Con un solo formulario, esa diferencia no puede volver a aparecer.

// Presets de validez. El primero es el que viene precargado al abrir el formulario.
const PRESETS = [30, 60, 90] as const;

// Se calcula al montar y no como constante de módulo: si el navegador queda abierto de un día
// para el otro, una constante congelada al importar dejaría la fecha de ayer.
const vacio = () => ({
  pacienteId: '', medicamento: '', dosis: '', indicacion: '',
  validoHasta: sumarDiasISO(PRESETS[0]),
});

type Campos = ReturnType<typeof vacio>;
type Errores = Partial<Record<keyof Campos, string>>;

interface Props {
  /** Lista para elegir paciente. Si no viene, se usa `pacienteFijo`. */
  pacientes?: PacienteRef[];
  /** Id del paciente cuando ya está determinado por el contexto. */
  pacienteFijo?: string;
  onSubmit: (data: CreateRecetaDTO) => Promise<void>;
  /** Error del servidor, para mostrarlo abajo de todo. */
  error?: string;
  /** Se expone para que el diálogo que lo contiene dispare el submit desde su footer. */
  formId: string;
}

export function RecetaForm({ pacientes, pacienteFijo, onSubmit, error, formId }: Props) {
  const [form, setForm] = useState<Campos>(vacio);
  const [errores, setErrores] = useState<Errores>({});

  const set = (campo: keyof Campos) => (valor: string) => {
    setForm(f => ({ ...f, [campo]: valor }));
    // Al corregir un campo se limpia su error, para no dejarlo en rojo mientras se escribe
    setErrores(e => (e[campo] ? { ...e, [campo]: undefined } : e));
  };

  const validar = (): Errores => {
    const pacienteId = pacienteFijo ?? form.pacienteId;
    return {
      pacienteId:  pacienteId ? undefined : 'Elegí un paciente',
      medicamento: validarMedicamento(form.medicamento),
      dosis:       validarDosis(form.dosis),
      indicacion:  validarIndicacion(form.indicacion),
      validoHasta: validarFechaValidez(form.validoHasta),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const encontrados = validar();
    setErrores(encontrados);
    if (Object.values(encontrados).some(Boolean)) return;

    try {
      await onSubmit({
        pacienteId:  pacienteFijo ?? form.pacienteId,
        medicamento: limpiar(form.medicamento),
        dosis:       limpiar(form.dosis),
        indicacion:  limpiar(form.indicacion),
        // El backend guarda un DateTime: mandamos el mediodía de la fecha elegida para que
        // no se corra un día al pasar por UTC.
        validoHasta: aISO(form.validoHasta),
      });
      // Solo se limpia si salió bien; si falló, el médico no pierde lo que escribió
      setForm(vacio());
      setErrores({});
    } catch {
      // El mensaje del servidor lo muestra el contenedor a través de la prop `error`
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
      {pacientes && (
        <Select
          label="Paciente"
          required
          value={form.pacienteId}
          error={errores.pacienteId}
          onChange={e => set('pacienteId')(e.target.value)}
        >
          <option value="">Seleccionar paciente…</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.apellido} · DNI {p.dni}</option>
          ))}
        </Select>
      )}

      <Input
        label="Medicamento"
        required
        maxLength={80}
        value={form.medicamento}
        error={errores.medicamento}
        onChange={e => set('medicamento')(e.target.value)}
        placeholder="Ej.: Amoxicilina 500 mg"
      />

      <Input
        label="Dosis"
        required
        maxLength={80}
        value={form.dosis}
        error={errores.dosis}
        onChange={e => set('dosis')(e.target.value)}
        placeholder="Ej.: 1 comprimido cada 8 hs"
      />

      <Textarea
        label="Indicación"
        required
        rows={3}
        maxLength={500}
        value={form.indicacion}
        error={errores.indicacion}
        hint={`${form.indicacion.length}/500 · mínimo 5 caracteres`}
        onChange={e => set('indicacion')(e.target.value)}
        placeholder="Instrucciones de uso…"
      />

      <div>
        <Input
          label="Válido hasta"
          type="date"
          required
          // El backend rechaza cualquier vencimiento que no sea posterior a hoy
          min={mananaISO()}
          value={form.validoHasta}
          error={errores.validoHasta}
          hint="Toda receta vence · tiene que ser una fecha posterior a hoy"
          onChange={e => set('validoHasta')(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          {PRESETS.map(dias => {
            const fecha = sumarDiasISO(dias);
            return (
              <button
                key={dias}
                type="button"
                onClick={() => set('validoHasta')(fecha)}
                aria-pressed={form.validoHasta === fecha}
                className={cn(
                  'rounded-pill px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors',
                  form.validoHasta === fecha
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : 'bg-surface text-slate-600 ring-slate-200 hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-200',
                )}
              >
                {dias} días
              </button>
            );
          })}
        </div>
      </div>

      {error && <AlertInline>{error}</AlertInline>}
    </form>
  );
}
