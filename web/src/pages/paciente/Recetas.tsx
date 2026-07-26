import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useMisRecetas } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { VigenciaBadge } from '../../components/VigenciaBadge';
import { RecetaImprimible } from '../../components/RecetaImprimible';
import {
  Card, PageHeader, EmptyState, SkeletonCards, StatCard, Tabs, SearchInput, Dialog, Button,
  AlertInline,
} from '../../ui';
import { IconPill, IconCheckCircle, IconAlert, IconPrinter, IconClock } from '../../ui/icons';
import { listContainer, listItem } from '../../lib/motion';
import { formatFecha } from '../../lib/format';
import { estadoReceta, DIAS_POR_VENCER } from '../../lib/fechas';
import { normalizar } from '../../lib/validaciones';
import type { Receta } from '../../services';

export default function PacienteRecetas() {
  const { data: recetas, isLoading } = useMisRecetas();
  const [tab, setTab] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [aImprimir, setAImprimir] = useState<Receta | null>(null);

  const { vigentes, porVencer, vencidas, visibles } = useMemo(() => {
    const lista = recetas ?? [];

    // Las que todavía sirven van primero, ordenadas por lo que vence antes: es lo que el
    // paciente necesita ver cuando entra. Las vencidas quedan al final, de la más reciente
    // a la más vieja.
    const orden = (r: Receta) => (estadoReceta(r.validoHasta) === 'vencida' ? 1 : 0);
    const ordenadas = [...lista].sort((a, b) => {
      const porEstado = orden(a) - orden(b);
      if (porEstado !== 0) return porEstado;
      return orden(a) === 1
        ? b.validoHasta.localeCompare(a.validoHasta)
        : a.validoHasta.localeCompare(b.validoHasta);
    });

    const vigentes = ordenadas.filter(r => estadoReceta(r.validoHasta) !== 'vencida');
    const vencidas = ordenadas.filter(r => estadoReceta(r.validoHasta) === 'vencida');
    // Subconjunto de las vigentes: siguen sirviendo, pero se acaba el plazo. Tienen pestaña
    // propia porque dentro de "Vigentes" quedaban mezcladas con las que vencen en meses.
    const porVencer = ordenadas.filter(r => estadoReceta(r.validoHasta) === 'por-vencer');

    const porTab = tab === 'vigentes' ? vigentes
      : tab === 'por-vencer' ? porVencer
      : tab === 'vencidas' ? vencidas
      : ordenadas;

    const q = normalizar(busqueda);
    const visibles = q
      ? porTab.filter(r =>
          normalizar(`${r.medicamento} ${r.dosis} ${r.medico?.nombre ?? ''} ${r.medico?.apellido ?? ''} ${r.medico?.especialidad?.nombre ?? ''}`).includes(q))
      : porTab;

    return { vigentes, porVencer, vencidas, visibles };
  }, [recetas, tab, busqueda]);

  const total = recetas?.length ?? 0;

  return (
    <PageTransition>
      <PageHeader
        title="Mis recetas"
        description={total === 1 ? '1 receta emitida' : `${total} recetas emitidas`}
      />

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : !total ? (
        <EmptyState
          icon={<IconPill />}
          title="Sin recetas"
          description="Cuando un médico te emita una receta, va a aparecer acá lista para usar."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatCard label="Total" value={total} icon={<IconPill />} tone="brand" />
            <StatCard label="Vigentes" value={vigentes.length} icon={<IconCheckCircle />} tone="success" />
            <StatCard label="Por vencer" value={porVencer.length} icon={<IconClock />} tone="warning" />
            <StatCard label="Vencidas" value={vencidas.length} icon={<IconAlert />} tone="danger" />
          </div>

          {/* Solo cuando hay algo que hacer: si no vence nada pronto, el aviso no aparece. */}
          {porVencer.length > 0 && (
            <AlertInline tono="warning" className="mb-4">
              {porVencer.length === 1
                ? `Tenés 1 receta que vence en los próximos ${DIAS_POR_VENCER} días.`
                : `Tenés ${porVencer.length} recetas que vencen en los próximos ${DIAS_POR_VENCER} días.`}
            </AlertInline>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'todas',      label: 'Todas',      count: total },
                { id: 'vigentes',   label: 'Vigentes',   count: vigentes.length },
                { id: 'por-vencer', label: 'Por vencer', count: porVencer.length },
                { id: 'vencidas',   label: 'Vencidas',   count: vencidas.length },
              ]}
            />
            <SearchInput
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por medicamento o médico…"
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
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {visibles.map(r => (
                <motion.div key={r.id} variants={listItem}>
                  <RecetaCard receta={r} onImprimir={() => setAImprimir(r)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      <Dialog
        open={!!aImprimir}
        onClose={() => setAImprimir(null)}
        title="Receta"
        description="Revisá los datos antes de imprimir o guardar como PDF."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAImprimir(null)}>Cerrar</Button>
            <Button iconLeft={<IconPrinter />} onClick={() => window.print()}>Imprimir</Button>
          </>
        }
      >
        {aImprimir && <RecetaImprimible receta={aImprimir} />}
      </Dialog>
    </PageTransition>
  );
}

function RecetaCard({ receta, onImprimir }: { receta: Receta; onImprimir: () => void }) {
  const vencida = estadoReceta(receta.validoHasta) === 'vencida';

  return (
    <Card className={`p-5 h-full flex flex-col ${vencida ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0 [&>svg]:w-5 [&>svg]:h-5">
          <IconPill />
        </span>
        <VigenciaBadge validoHasta={receta.validoHasta} />
      </div>

      <p className="font-semibold text-slate-900 leading-tight">{receta.medicamento}</p>
      <p className="text-[13px] font-medium text-brand-700 mt-0.5">{receta.dosis}</p>
      <p className="text-sm text-slate-600 leading-relaxed mt-3 flex-1">{receta.indicacion}</p>

      <div className="flex items-end justify-between gap-3 border-t border-slate-100 mt-4 pt-3.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 truncate">
            Dr. {receta.medico?.nombre} {receta.medico?.apellido}
          </p>
          <p className="text-xs text-slate-400 truncate">{receta.medico?.especialidad?.nombre}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-xs text-slate-400 whitespace-nowrap tnum">{formatFecha(receta.fechaEmision)}</p>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Imprimir receta de ${receta.medicamento}`}
            onClick={onImprimir}
          >
            <IconPrinter />
          </Button>
        </div>
      </div>
    </Card>
  );
}
