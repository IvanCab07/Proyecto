import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { useRecetasMedico, useMiAgenda, useCrearReceta } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, Input, Select, Textarea, PageHeader, EmptyState, SkeletonCards, StatCard,
} from '../../ui';
import { IconPlus, IconPill, IconAlert, IconUsers } from '../../ui/icons';
import { formatFecha } from '../../lib/format';

const EMPTY = { pacienteId: '', medicamento: '', dosis: '', indicacion: '', validoHasta: '' };

export default function MedicoRecetas() {
  const { data: recetas, isLoading } = useRecetasMedico();
  const { data: agenda } = useMiAgenda();
  const crear = useCrearReceta();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  // Pacientes que el médico atendió (derivado de su agenda)
  const pacientes = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; apellido: string }>();
    for (const t of agenda ?? []) if (t.paciente) map.set(t.paciente.id, t.paciente);
    return [...map.values()].sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [agenda]);

  const handleEmitir = async () => {
    if (!form.pacienteId || !form.medicamento || !form.dosis || !form.indicacion) {
      return setError('Paciente, medicamento, dosis e indicación son obligatorios');
    }
    setError('');
    try {
      await crear.mutateAsync({
        pacienteId: form.pacienteId,
        medicamento: form.medicamento,
        dosis: form.dosis,
        indicacion: form.indicacion,
        validoHasta: form.validoHasta || undefined,
      });
      toast.success('Receta emitida');
      setModal(false); setForm(EMPTY);
    } catch (e) {
      setError(apiError(e, 'No se pudo emitir la receta'));
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Recetas"
        description="Emití recetas para los pacientes que atendés."
        actions={
          <Button iconLeft={<IconPlus />} onClick={() => { setForm(EMPTY); setError(''); setModal(true); }} disabled={pacientes.length === 0}>
            Nueva receta
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : !recetas?.length ? (
        <Card>
          <EmptyState
            icon={<IconPill />}
            title="Sin recetas"
            description={pacientes.length === 0 ? 'Vas a poder emitir recetas cuando tengas pacientes en tu agenda.' : 'Emití la primera receta con el botón “Nueva receta”.'}
          />
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <StatCard label="Recetas emitidas" value={recetas.length} icon={<IconPill />} tone="brand" />
          <StatCard label="Pacientes atendidos" value={pacientes.length} icon={<IconUsers />} tone="accent" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recetas.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0"><IconPill /></span>
                  <div>
                    <p className="font-semibold text-slate-900">{r.medicamento}</p>
                    <p className="text-[13px] text-brand-700 font-medium">{r.dosis}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 tnum whitespace-nowrap">{formatFecha(r.fechaEmision)}</span>
              </div>
              {r.indicacion && <p className="text-[13px] text-slate-600 mt-2.5">{r.indicacion}</p>}
              {r.paciente && (
                <p className="text-[12px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">
                  Paciente: {r.paciente.nombre} {r.paciente.apellido}
                </p>
              )}
            </Card>
          ))}
        </div>
        </>
      )}

      <Dialog
        open={modal}
        onClose={() => setModal(false)}
        title="Emitir nueva receta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={handleEmitir} loading={crear.isPending}>Emitir receta</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Paciente" required value={form.pacienteId} onChange={e => setForm(f => ({ ...f, pacienteId: e.target.value }))}>
            <option value="">Seleccionar paciente…</option>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </Select>
          <Input label="Medicamento" required value={form.medicamento} onChange={e => setForm(f => ({ ...f, medicamento: e.target.value }))} placeholder="Ej.: Amoxicilina 500 mg" />
          <Input label="Dosis" required value={form.dosis} onChange={e => setForm(f => ({ ...f, dosis: e.target.value }))} placeholder="Ej.: 1 comprimido cada 8 hs" />
          <Textarea label="Indicación" required rows={3} value={form.indicacion} onChange={e => setForm(f => ({ ...f, indicacion: e.target.value }))} placeholder="Instrucciones de uso…" />
          <Input label="Válido hasta" hint="Opcional" type="date" value={form.validoHasta} onChange={e => setForm(f => ({ ...f, validoHasta: e.target.value }))} />
          {error && (
            <div className="flex items-center gap-2.5 bg-danger-soft text-danger-text rounded-field px-3.5 py-3 text-[13px] font-medium">
              <IconAlert className="shrink-0" />
              {error}
            </div>
          )}
        </div>
      </Dialog>
    </PageTransition>
  );
}
