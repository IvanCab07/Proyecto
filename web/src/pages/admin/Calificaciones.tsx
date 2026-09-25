import { useCalificacionesAdmin } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Stars, PageHeader, EmptyState, SkeletonTable, Avatar,
  Table, THead, TH, TBody, TR, TD,
} from '../../ui';
import { IconSparkle } from '../../ui/icons';
import { formatFecha } from '../../lib/format';

export default function AdminCalificaciones() {
  const { data, isLoading } = useCalificacionesAdmin();
  const calificaciones = data?.calificaciones ?? [];
  const promedios = data?.promediosPorMedico ?? [];

  const totalResenas = calificaciones.length;
  const promedioGeneral = totalResenas
    ? Math.round((calificaciones.reduce((acc, c) => acc + c.estrellas, 0) / totalResenas) * 10) / 10
    : 0;

  return (
    <PageTransition>
      <PageHeader
        title="Calificaciones"
        description="Reseñas de los pacientes y promedio de estrellas por médico."
      />

      {isLoading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : totalResenas === 0 ? (
        <Card>
          <EmptyState
            icon={<IconSparkle />}
            title="Sin calificaciones todavía"
            description="Cuando los pacientes califiquen sus turnos completados, vas a ver acá las reseñas y los promedios."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Promedio general */}
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 grid place-items-center shrink-0">
              <IconSparkle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500">Promedio general del hospital</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Stars value={promedioGeneral} size={20} />
                <span className="text-lg font-bold text-slate-900 tnum">{promedioGeneral.toFixed(1)}</span>
                <span className="text-[13px] text-slate-400">· {totalResenas} {totalResenas === 1 ? 'reseña' : 'reseñas'}</span>
              </div>
            </div>
          </Card>

          {/* Promedio por médico */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Promedio por médico</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {promedios.map(p => (
                <Card key={p.medicoId} className="p-4">
                  <p className="font-semibold text-slate-900 text-sm truncate">{p.nombre}</p>
                  <p className="text-[13px] text-slate-500">{p.especialidad}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Stars value={p.promedio} size={16} />
                    <span className="text-sm font-bold text-slate-900 tnum">{p.promedio.toFixed(1)}</span>
                    <span className="text-[12px] text-slate-400">({p.cantidad})</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Detalle de reseñas */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Todas las reseñas</p>
            <Card className="overflow-hidden">
              <Table>
                <THead>
                  <TH>Paciente</TH>
                  <TH>Médico</TH>
                  <TH>Calificación</TH>
                  <TH>Comentario</TH>
                  <TH>Fecha</TH>
                </THead>
                <TBody>
                  {calificaciones.map(c => (
                    <TR key={c.id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm" nombre={c.paciente?.nombre} apellido={c.paciente?.apellido} />
                          <span className="font-medium text-slate-900 whitespace-nowrap">
                            {c.paciente ? `${c.paciente.nombre} ${c.paciente.apellido}` : '—'}
                          </span>
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap">
                        {c.medico ? `Dr. ${c.medico.nombre} ${c.medico.apellido}` : '—'}
                        {c.medico && <span className="block text-xs text-slate-400">{c.medico.especialidad.nombre}</span>}
                      </TD>
                      <TD><Stars value={c.estrellas} size={15} /></TD>
                      <TD className="max-w-xs">
                        {c.comentario ? <span className="text-slate-600 text-[13px] italic">“{c.comentario}”</span> : <span className="text-slate-300">—</span>}
                      </TD>
                      <TD className="whitespace-nowrap tnum text-slate-500">{formatFecha(c.createdAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
