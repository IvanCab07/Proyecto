import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import {
  useRecetasMedico, usePacientesDelMedico, useCrearReceta, useEliminarReceta,
} from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { RecetaForm } from '../../components/medico/RecetaForm';
import {
  Card, Button, Dialog, ConfirmDialog, SearchInput, Tabs, PageHeader,
  EmptyState, SkeletonCards, StatCard,
} from '../../ui';
import { IconPlus, IconPill, IconUsers, IconTrash, IconAlert, IconClock } from '../../ui/icons';
import { VigenciaBadge } from '../../components/VigenciaBadge';
import { formatFecha } from '../../lib/format';
import { estadoReceta } from '../../lib/fechas';
import { normalizar } from '../../lib/validaciones';
import { listContainer, listItem } from '../../lib/motion';
import type { CreateRecetaDTO, Receta } from '../../services';

export default function MedicoRecetas() {
  const { data: recetas, isLoading } = useRecetasMedico();
  const { pacientes } = usePacientesDelMedico();
  const crear = useCrearReceta();
  const eliminar = useEliminarReceta();

  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tab, setTab] = useState('todas');
  const [aBorrar, setABorrar] = useState<Receta | null>(null);

  const { vigentes, porVencer, vencidas } = useMemo(() => {
    const lista = recetas ?? [];
    return {
      // "Por vencer" cuenta como vigente: sigue sirviendo, solo se avisa en el badge
      vigentes: lista.filter(r => estadoReceta(r.validoHasta) !== 'vencida'),
      // Subconjunto de las vigentes, con pestaña propia: son las que el médico querría
      // renovar antes de que el paciente se quede sin medicación.
      porVencer: lista.filter(r => estadoReceta(r.validoHasta) === 'por-vencer'),
      vencidas: lista.filter(r => estadoReceta(r.validoHasta) === 'vencida'),
    };
  }, [recetas]);

  const visibles = useMemo(() => {
    const base = tab === 'vigentes' ? vigentes
      : tab === 'por-vencer' ? porVencer
      : tab === 'vencidas' ? vencidas
      : (recetas ?? []);
    const texto = normalizar(busqueda);
    if (!texto) return base;
    return base.filter(r => normalizar(
      `${r.medicamento} ${r.dosis} ${r.paciente?.nombre ?? ''} ${r.paciente?.apellido ?? ''} ${r.paciente?.dni ?? ''}`,
    ).includes(texto));
  }, [recetas, vigentes, porVencer, vencidas, tab, busqueda]);

  const handleEmitir = async (data: CreateRecetaDTO) => {
    setError('');
    try {
      await crear.mutateAsync(data);
      toast.success('Receta emitida');
      setModal(false);
    } catch (e) {
      setError(apiError(e, 'No se pudo emitir la receta'));
      throw e;
    }
  };

  const handleEliminar = async () => {
    if (!aBorrar) return;
    try {
      await eliminar.mutateAsync(aBorrar.id);
      toast.success('Receta eliminada');
      setABorrar(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo eliminar la receta'));
    }
  };

  const sinPacientes = pacientes.length === 0;

  return (
    <PageTransition>
      <PageHeader
        title="Recetas"
        description="Emití recetas para los pacientes que atendés."
        actions={
          <Button
            iconLeft={<IconPlus />}
            onClick={() => { setError(''); setModal(true); }}
            disabled={sinPacientes}
            title={sinPacientes ? 'Necesitás tener pacientes en tu agenda' : undefined}
          >
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
            description={
              sinPacientes
                ? 'Vas a poder emitir recetas cuando tengas pacientes en tu agenda.'
                : 'Emití la primera receta con el botón “Nueva receta”.'
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <StatCard label="Recetas emitidas" value={recetas.length} icon={<IconPill />} tone="brand" />
            <StatCard label="Vigentes" value={vigentes.length} icon={<IconPill />} tone="success" />
            <StatCard label="Por vencer" value={porVencer.length} icon={<IconClock />} tone="warning" />
            <StatCard label="Vencidas" value={vencidas.length} icon={<IconAlert />} tone="danger" />
            <StatCard label="Pacientes atendidos" value={pacientes.length} icon={<IconUsers />} tone="accent" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'todas',      label: 'Todas',      count: recetas.length },
                { id: 'vigentes',   label: 'Vigentes',   count: vigentes.length },
                { id: 'por-vencer', label: 'Por vencer', count: porVencer.length },
                { id: 'vencidas',   label: 'Vencidas',   count: vencidas.length },
              ]}
            />
            <SearchInput
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por medicamento o paciente…"
              className="sm:max-w-xs sm:ml-auto"
            />
          </div>

          {visibles.length === 0 ? (
            <Card>
              <EmptyState
                icon={<IconPill />}
                title="Sin resultados"
                description="Ninguna receta coincide con lo que buscaste."
              />
            </Card>
          ) : (
            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {visibles.map(r => (
                <motion.div key={r.id} variants={listItem}>
                  <RecetaCard receta={r} onEliminar={() => setABorrar(r)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      <Dialog
        open={modal}
        onClose={() => setModal(false)}
        title="Emitir nueva receta"
        description="Los campos marcados con * son obligatorios."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" form="receta-nueva" loading={crear.isPending}>Emitir receta</Button>
          </>
        }
      >
        <RecetaForm
          formId="receta-nueva"
          pacientes={pacientes}
          onSubmit={handleEmitir}
          error={error}
        />
      </Dialog>

      <ConfirmDialog
        open={!!aBorrar}
        onClose={() => setABorrar(null)}
        onConfirm={handleEliminar}
        title="Eliminar receta"
        message={`Se va a eliminar la receta de ${aBorrar?.medicamento}. El paciente va a dejar de verla en su cuenta.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={eliminar.isPending}
      />
    </PageTransition>
  );
}

function RecetaCard({ receta, onEliminar }: { receta: Receta; onEliminar: () => void }) {
  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0">
            <IconPill />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{receta.medicamento}</p>
            <p className="text-[13px] text-brand-700 font-medium truncate">{receta.dosis}</p>
          </div>
        </div>
        <span className="text-xs text-slate-400 tnum whitespace-nowrap">{formatFecha(receta.fechaEmision)}</span>
      </div>

      {receta.indicacion && <p className="text-[13px] text-slate-600 mt-2.5">{receta.indicacion}</p>}

      <p className="mt-2.5">
        <VigenciaBadge validoHasta={receta.validoHasta} />
      </p>

      <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-slate-100">
        <p className="text-[12px] text-slate-400 truncate">
          {receta.paciente ? `${receta.paciente.nombre} ${receta.paciente.apellido}` : 'Paciente'}
        </p>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Eliminar receta de ${receta.medicamento}`}
          className="text-danger hover:bg-danger-soft shrink-0"
          onClick={onEliminar}
        >
          <IconTrash />
        </Button>
      </div>
    </Card>
  );
}
