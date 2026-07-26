import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useMisCalificacionesMedico } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Stars, PageHeader, EmptyState, SkeletonCards, SkeletonStatCard, Avatar, Button,
} from '../../ui';
import { IconSparkle, IconUsers, IconCheckCircle, IconChart } from '../../ui/icons';
import { formatFecha } from '../../lib/format';
import { cn } from '../../lib/cn';
import { listContainer, listItem } from '../../lib/motion';

// Panel de reputación del médico: cuántos pacientes atendió, cuántos lo calificaron,
// qué promedio tiene y cómo se reparten las estrellas.

const ESTRELLAS = [5, 4, 3, 2, 1];

export default function MedicoCalificaciones() {
  const { data, isLoading } = useMisCalificacionesMedico();
  const [filtro, setFiltro] = useState<number | null>(null);

  const promedio = data?.promedio ?? 0;
  const cantidad = data?.cantidad ?? 0;
  const atendidos = data?.atendidos ?? 0;
  const tasaRespuesta = data?.tasaRespuesta ?? 0;
  const distribucion = data?.distribucion;

  const visibles = useMemo(() => {
    const lista = data?.calificaciones ?? [];
    return filtro ? lista.filter(c => c.estrellas === filtro) : lista;
  }, [data?.calificaciones, filtro]);

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Mis calificaciones" description="Cómo te califican los pacientes que atendés." />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <SkeletonCards count={4} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Mis calificaciones"
        description="Cómo te califican los pacientes que atendés."
      />

      {/* Banda de métricas */}
      <Card className="p-0 overflow-hidden mb-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          <Metrica
            label="Pacientes atendidos"
            valor={atendidos.toLocaleString('es-AR')}
            hint="Turnos completados"
            icon={<IconUsers />}
          />
          <Metrica
            label="Reseñas recibidas"
            valor={cantidad.toLocaleString('es-AR')}
            hint={cantidad === 1 ? '1 paciente te calificó' : `${cantidad} pacientes te calificaron`}
            icon={<IconSparkle />}
          />
          <Metrica
            label="Promedio"
            valor={cantidad ? promedio.toFixed(1) : '—'}
            hint={cantidad ? 'sobre 5 estrellas' : 'sin reseñas todavía'}
            icon={<IconChart />}
            destacado
          />
          <Metrica
            label="Tasa de respuesta"
            valor={`${tasaRespuesta}%`}
            hint="De tus consultas dejaron reseña"
            icon={<IconCheckCircle />}
          />
        </div>
      </Card>

      {cantidad === 0 ? (
        <Card>
          <EmptyState
            icon={<IconSparkle />}
            title="Todavía no tenés calificaciones"
            description={
              atendidos > 0
                ? 'Ya completaste consultas, pero ningún paciente dejó su reseña todavía.'
                : 'Cuando completes turnos y tus pacientes te califiquen, vas a ver acá sus reseñas.'
            }
          />
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr] gap-5 items-start">
          {/* Distribución de estrellas */}
          <Card className="p-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 grid place-items-center shrink-0">
                <IconSparkle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 tnum leading-none">{promedio.toFixed(1)}</p>
                <Stars value={promedio} size={16} className="mt-1.5" />
                <p className="text-[12px] text-slate-400 mt-1">
                  {cantidad} {cantidad === 1 ? 'reseña' : 'reseñas'}
                </p>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2.5">
              Distribución
            </p>
            <div className="space-y-1.5">
              {ESTRELLAS.map(estrella => {
                const n = distribucion?.[estrella] ?? 0;
                const pct = cantidad ? Math.round((n / cantidad) * 100) : 0;
                const activo = filtro === estrella;
                return (
                  <button
                    key={estrella}
                    type="button"
                    disabled={n === 0}
                    aria-pressed={activo}
                    onClick={() => setFiltro(activo ? null : estrella)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors text-left',
                      n === 0 ? 'opacity-50 cursor-default' : 'hover:bg-slate-50',
                      activo && 'bg-brand-50 ring-1 ring-inset ring-brand-200',
                    )}
                  >
                    <span className="text-[13px] font-semibold text-slate-600 tnum w-7 shrink-0">
                      {estrella} ★
                    </span>
                    <span className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.span
                        className="block h-full bg-amber-400 rounded-full origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: cantidad ? n / cantidad : 0 }}
                        transition={{ duration: 0.5, delay: (5 - estrella) * 0.06 }}
                      />
                    </span>
                    <span className="text-[12px] text-slate-400 tnum w-12 text-right shrink-0">
                      {n} · {pct}%
                    </span>
                  </button>
                );
              })}
            </div>

            {filtro && (
              <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setFiltro(null)}>
                Ver todas las reseñas
              </Button>
            )}
          </Card>

          {/* Reseñas */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              {filtro ? `Reseñas de ${filtro} ${filtro === 1 ? 'estrella' : 'estrellas'}` : 'Todas las reseñas'}
              {' · '}{visibles.length}
            </p>
            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="visible"
              key={filtro ?? 'todas'}
              className="space-y-2.5"
            >
              {visibles.map(c => (
                <motion.div key={c.id} variants={listItem}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar size="sm" nombre={c.paciente?.nombre} apellido={c.paciente?.apellido} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">
                            {c.paciente ? `${c.paciente.nombre} ${c.paciente.apellido}` : 'Paciente'}
                          </span>
                          <span className="text-xs text-slate-400 tnum">{formatFecha(c.createdAt)}</span>
                        </div>
                        <Stars value={c.estrellas} size={15} className="mt-1" />
                        {c.comentario && (
                          <p className="text-[13px] text-slate-600 italic mt-2">“{c.comentario}”</p>
                        )}
                        {c.turno && (
                          <p className="text-[12px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                            Consulta del {formatFecha(c.turno.fecha)} · {c.turno.hora} hs
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

interface MetricaProps {
  label: string;
  valor: string;
  hint: string;
  icon: React.ReactNode;
  destacado?: boolean;
}

function Metrica({ label, valor, hint, icon, destacado }: MetricaProps) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
        <span className={cn('[&>svg]:w-4 [&>svg]:h-4', destacado ? 'text-amber-500' : 'text-slate-400')}>
          {icon}
        </span>
        {label}
      </div>
      <p
        className={cn(
          'text-[26px] font-bold tracking-tighter2 leading-none mt-2 tnum',
          destacado ? 'text-amber-500' : 'text-slate-900',
        )}
      >
        {valor}
      </p>
      <p className="text-[12px] text-slate-400 mt-1.5">{hint}</p>
    </div>
  );
}
