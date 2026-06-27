import { useMisCalificacionesMedico } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import { Card, Stars, PageHeader, EmptyState, SkeletonTable, Avatar } from '../../ui';
import { IconSparkle } from '../../ui/icons';
import { formatFecha } from '../../lib/format';

export default function MedicoCalificaciones() {
  const { data, isLoading } = useMisCalificacionesMedico();
  const calificaciones = data?.calificaciones ?? [];
  const promedio = data?.promedio ?? 0;
  const cantidad = data?.cantidad ?? 0;

  return (
    <PageTransition>
      <PageHeader
        title="Mis calificaciones"
        description="Las reseñas que te dejaron los pacientes después de sus turnos."
      />

      {isLoading ? (
        <SkeletonTable rows={5} cols={3} />
      ) : cantidad === 0 ? (
        <Card>
          <EmptyState
            icon={<IconSparkle />}
            title="Todavía no tenés calificaciones"
            description="Cuando tus pacientes califiquen los turnos que completaste, vas a ver acá sus reseñas."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Promedio */}
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 grid place-items-center shrink-0">
              <IconSparkle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500">Tu promedio</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Stars value={promedio} size={20} />
                <span className="text-lg font-bold text-slate-900 tnum">{promedio.toFixed(1)}</span>
                <span className="text-[13px] text-slate-400">· {cantidad} {cantidad === 1 ? 'reseña' : 'reseñas'}</span>
              </div>
            </div>
          </Card>

          {/* Reseñas */}
          <div className="space-y-2.5">
            {calificaciones.map(c => (
              <Card key={c.id} className="p-4">
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
