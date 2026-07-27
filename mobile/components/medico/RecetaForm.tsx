import { useState } from 'react';
import { View, Text } from 'react-native';
import {
  Button, Input, Textarea, Chip, Sheet, Calendario,
  IconCalendar,
} from '../ui';
import { PressableScale } from '../../lib/motion';
import { useTheme } from '../../lib/useTheme';
import { aISO, hoyISO, sumarDiasISO, fechaDeTurno } from '../../lib/fechas';
import { limpiar, LIMITES, validarMedicamento, validarDosis, validarIndicacion } from '../../lib/validaciones';
import { formatFechaLarga } from '../../lib/format';
import type { CreateRecetaDTO } from '../../services';

export interface PacienteRef {
  id: string;
  nombre: string;
  apellido: string;
  dni?: string;
}

interface Props {
  /** Chips para elegir paciente. Si no viene, se usa pacienteFijo. */
  pacientes?: PacienteRef[];
  /** Paciente ya determinado por el contexto (historial del paciente). */
  pacienteFijo?: PacienteRef;
  onSubmit: (data: CreateRecetaDTO) => Promise<void>;
  loading?: boolean;
}

const PRESETS = [30, 60, 90];
const VACIO = { pacienteId: '', medicamento: '', dosis: '', indicacion: '' };

/**
 * Formulario de emisión de receta. Lo comparten la pestaña Recetas y el historial del paciente:
 * antes cada una tenía su copia y mandaban `validoHasta` en formatos distintos (una el string
 * crudo del input, la otra `new Date(x).toISOString()`, que en UTC-3 corría la fecha un día
 * para atrás). Acá siempre sale por `aISO()`, que ancla al mediodía local.
 */
export function RecetaForm({ pacientes, pacienteFijo, onSubmit, loading }: Props) {
  const { colors } = useTheme();

  const [form, setForm] = useState(VACIO);
  // Arranca en 30 días, igual que la web y que el default del backend.
  const [validoHasta, setValidoHasta] = useState(() => sumarDiasISO(30));
  const [verCalendario, setVerCalendario] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const set = (campo: keyof typeof VACIO) => (v: string) => {
    setForm(f => ({ ...f, [campo]: v }));
    setErrores(e => { const { [campo]: _, ...resto } = e; return resto; });
  };

  const presetActivo = PRESETS.find(d => sumarDiasISO(d) === validoHasta) ?? null;

  const enviar = async () => {
    const pacienteId = pacienteFijo?.id ?? form.pacienteId;

    const nuevos: Record<string, string> = {};
    if (!pacienteId) nuevos.pacienteId = 'Elegí un paciente';
    const medicamento = validarMedicamento(form.medicamento);
    const dosis = validarDosis(form.dosis);
    const indicacion = validarIndicacion(form.indicacion);
    if (medicamento) nuevos.medicamento = medicamento;
    if (dosis) nuevos.dosis = dosis;
    if (indicacion) nuevos.indicacion = indicacion;

    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    await onSubmit({
      pacienteId,
      medicamento: limpiar(form.medicamento),
      dosis: limpiar(form.dosis),
      indicacion: limpiar(form.indicacion),
      validoHasta: aISO(validoHasta),
    });

    setForm(VACIO);
    setValidoHasta(sumarDiasISO(30));
    setErrores({});
  };

  return (
    <View>
      {pacienteFijo ? (
        <Text className="text-[13px] text-slate-400 mb-3">
          Para {pacienteFijo.nombre} {pacienteFijo.apellido}
        </Text>
      ) : (
        <>
          <Text className="text-[13px] font-semibold text-slate-700 mb-2">Paciente</Text>
          <View className="flex-row flex-wrap gap-2 mb-1">
            {pacientes?.map(p => (
              <Chip
                key={p.id}
                label={`${p.nombre} ${p.apellido}`}
                active={form.pacienteId === p.id}
                onPress={() => set('pacienteId')(p.id)}
              />
            ))}
          </View>
          {errores.pacienteId ? (
            <Text className="text-[12px] mb-2" style={{ color: colors.danger.text }}>{errores.pacienteId}</Text>
          ) : <View className="mb-2" />}
        </>
      )}

      <Input
        label="Medicamento"
        value={form.medicamento}
        onChangeText={set('medicamento')}
        error={errores.medicamento}
        maxLength={LIMITES.medicamento}
        placeholder="Ej: Amoxicilina 500 mg"
        className="mb-3"
      />
      <Input
        label="Dosis"
        value={form.dosis}
        onChangeText={set('dosis')}
        error={errores.dosis}
        maxLength={LIMITES.dosis}
        placeholder="Ej: 1 comprimido cada 8 hs"
        className="mb-3"
      />
      <Textarea
        label="Indicación"
        value={form.indicacion}
        onChangeText={set('indicacion')}
        error={errores.indicacion}
        maxLength={LIMITES.indicacion}
        placeholder="Instrucciones de uso…"
        className="mb-3"
      />

      {/* Validez: en RN no hay <input type="date">, así que presets + calendario. Antes era un
          campo de texto libre "AAAA-MM-DD" sin ninguna validación. */}
      <Text className="text-[13px] font-semibold text-slate-700 mb-2">Válido hasta</Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {PRESETS.map(dias => (
          <Chip
            key={dias}
            label={`${dias} días`}
            active={presetActivo === dias}
            onPress={() => { setValidoHasta(sumarDiasISO(dias)); setVerCalendario(false); }}
          />
        ))}
        <Chip
          label="Otra fecha…"
          active={presetActivo === null}
          onPress={() => setVerCalendario(true)}
        />
      </View>

      <View className="flex-row items-center gap-1.5 mb-4 px-1">
        <IconCalendar size={13} color={colors.success.DEFAULT} />
        <Text className="text-[12px] font-semibold capitalize" style={{ color: colors.success.text }}>
          {formatFechaLarga(fechaDeTurno(validoHasta).toISOString())}
        </Text>
      </View>

      <Button fullWidth loading={loading} onPress={enviar}>Emitir receta</Button>

      <Sheet visible={verCalendario} onClose={() => setVerCalendario(false)} title="Vencimiento de la receta">
        <Calendario
          conCard={false}
          titulo="Elegí hasta cuándo vale"
          ayuda="Tiene que ser posterior a hoy."
          seleccion={validoHasta}
          onSelect={(fecha) => { setValidoHasta(fecha); setVerCalendario(false); }}
          deshabilitar={(fecha) => fecha <= hoyISO()}
        />
      </Sheet>
    </View>
  );
}
