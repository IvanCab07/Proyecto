import { motion } from 'motion/react';
import { useMisRecetas } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { Card, PageHeader, EmptyState, SkeletonCards, StatCard } from '../../ui';
import { IconPill, IconCheckCircle, IconAlert } from '../../ui/icons';
import { listContainer, listItem } from '../../lib/motion';
import { formatFecha } from '../../lib/format';

export default function PacienteRecetas() {
  const { data: recetas, isLoading } = useMisRecetas();
  const today = new Date();
  const total = recetas?.length ?? 0;
  const vencidas = (recetas ?? []).filter(r => r.validoHasta && new Date(r.validoHasta) < today).length;
  const vigentes = total - vencidas;

  return (
    <PageTransition>
      <PageHeader
        title="Mis recetas"
        description={total === 1 ? '1 receta emitida' : `${total} recetas emitidas`}
      />

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : !recetas?.length ? (
        <EmptyState
          icon={<IconPill />}
          title="Sin recetas"
          description="Cuando un médico te emita una receta, va a aparecer acá lista para usar."
        />
      ) : (
        <>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="Total" value={total} icon={<IconPill />} tone="brand" />
          <StatCard label="Vigentes" value={vigentes} icon={<IconCheckCircle />} tone="success" />
          <StatCard label="Vencidas" value={vencidas} icon={<IconAlert />} tone="danger" />
        </div>
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {recetas.map(r => {
            const vencida = r.validoHasta ? new Date(r.validoHasta) < today : false;
            return (
              <motion.div key={r.id} variants={listItem}>
                <Card className="p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                      <IconPill />
                    </span>
                    {r.validoHasta && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-pill whitespace-nowrap ${
                          vencida ? 'bg-danger-soft text-danger-text' : 'bg-success-soft text-success-text'
                        }`}
                      >
                        {vencida ? 'Vencida' : `Vence ${formatFecha(r.validoHasta)}`}
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-slate-900 leading-tight">{r.medicamento}</p>
                  <p className="text-[13px] font-medium text-brand-700 mt-0.5">{r.dosis}</p>
                  <p className="text-sm text-slate-600 leading-relaxed mt-3 flex-1">{r.indicacion}</p>

                  <div className="flex items-end justify-between gap-3 border-t border-slate-100 mt-4 pt-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">
                        Dr. {r.medico?.nombre} {r.medico?.apellido}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{r.medico?.especialidad?.nombre}</p>
                    </div>
                    <p className="text-xs text-slate-400 whitespace-nowrap tnum">{formatFecha(r.fechaEmision)}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
        </>
      )}
    </PageTransition>
  );
}
