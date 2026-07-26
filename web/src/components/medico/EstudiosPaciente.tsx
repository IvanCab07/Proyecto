import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Button, Dialog, Input, Textarea, ConfirmDialog, AlertInline, Spinner,
} from '../../ui';
import { IconUpload, IconDoc, IconImage, IconEye, IconTrash, IconCheck } from '../../ui/icons';
import { apiBaseUrl } from '../../services/api';
import { cn } from '../../lib/cn';
import { apiError } from '../../lib/apiError';
import { formatFecha } from '../../lib/format';
import { useEstudiosPaciente, useSubirEstudio, useEliminarEstudio } from '../../hooks';
import { useAuthStore } from '../../store/useAuthStore';
import type { Estudio, PacienteRef } from '../../services';

// Estudios de un paciente dentro del historial del médico: ver, subir y eliminar.
// Los límites son los mismos que aplica multer en el backend.
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];

const esPdf = (e: Estudio) =>
  e.tipoArchivo?.toLowerCase() === 'application/pdf'
  || e.archivoUrl?.toLowerCase().endsWith('.pdf')
  || e.tipoArchivo?.toLowerCase() === 'pdf';

export function EstudiosPaciente({ paciente }: { paciente: PacienteRef }) {
  const userId = useAuthStore(s => s.user?.id);
  const { data: estudios, isLoading, error: errorCarga } = useEstudiosPaciente(paciente.id);
  const subir = useSubirEstudio();
  const eliminar = useEliminarEstudio();

  const [modal, setModal] = useState(false);
  const [aBorrar, setABorrar] = useState<Estudio | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const cerrarModal = () => {
    setModal(false);
    setTitulo(''); setDescripcion(''); setArchivo(null); setError('');
  };

  const handleArchivo = (file: File | null) => {
    setError('');
    if (!file) return setArchivo(null);
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setArchivo(null);
      return setError('Solo se aceptan archivos PDF, JPG o PNG');
    }
    if (file.size > MAX_BYTES) {
      setArchivo(null);
      return setError('El archivo supera el máximo de 10 MB');
    }
    setArchivo(file);
  };

  const handleSubir = async () => {
    if (!titulo.trim() || !archivo) return setError('El título y el archivo son obligatorios');
    setError('');

    const fd = new FormData();
    fd.append('titulo', titulo.trim());
    if (descripcion.trim()) fd.append('descripcion', descripcion.trim());
    // Sin esto el estudio se guardaría a nombre del médico en vez del paciente
    fd.append('pacienteId', paciente.id);
    fd.append('archivo', archivo);

    try {
      await subir.mutateAsync(fd);
      toast.success('Estudio subido correctamente');
      cerrarModal();
    } catch (e) {
      setError(apiError(e, 'Error al subir el estudio'));
    }
  };

  const handleEliminar = async () => {
    if (!aBorrar) return;
    try {
      await eliminar.mutateAsync(aBorrar.id);
      toast.success('Estudio eliminado');
      setABorrar(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo eliminar el estudio'));
    }
  };

  return (
    <div className="min-h-[200px]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[13px] text-slate-500">
          Estudios de {paciente.nombre}. Solo podés eliminar los que subiste vos.
        </p>
        <Button size="sm" iconLeft={<IconUpload />} onClick={() => setModal(true)}>
          Subir estudio
        </Button>
      </div>

      {isLoading ? (
        <div className="py-10 grid place-items-center"><Spinner /></div>
      ) : errorCarga ? (
        <AlertInline>{apiError(errorCarga, 'No se pudieron cargar los estudios')}</AlertInline>
      ) : !estudios?.length ? (
        <p className="text-sm text-slate-400 py-8 text-center">
          Este paciente todavía no tiene estudios cargados.
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {estudios.map(e => {
            const pdf = esPdf(e);
            const puedeBorrar = !!userId && e.subidoPorId === userId;
            return (
              <div key={e.id} className="flex items-center gap-3 px-3.5 py-3 rounded-field ring-1 ring-inset ring-slate-100">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl grid place-items-center shrink-0 [&>svg]:w-5 [&>svg]:h-5',
                    pdf ? 'bg-danger-soft text-danger-text' : 'bg-info-soft text-info-text',
                  )}
                >
                  {pdf ? <IconDoc /> : <IconImage />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{e.titulo}</p>
                  {e.descripcion && <p className="text-[13px] text-slate-500 truncate">{e.descripcion}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-500">{pdf ? 'PDF' : 'Imagen'}</span>
                    {' · '}{formatFecha(e.fecha)}
                    {puedeBorrar && ' · lo subiste vos'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<IconEye />}
                    onClick={() => window.open(`${apiBaseUrl}${e.archivoUrl}`, '_blank', 'noopener,noreferrer')}
                  >
                    Ver
                  </Button>
                  {puedeBorrar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Eliminar ${e.titulo}`}
                      className="text-danger hover:bg-danger-soft"
                      onClick={() => setABorrar(e)}
                    >
                      <IconTrash />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subir */}
      <Dialog
        open={modal}
        onClose={cerrarModal}
        title="Subir estudio"
        description={`Para ${paciente.nombre} ${paciente.apellido} · PDF, JPG o PNG de hasta 10 MB.`}
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
            <Button onClick={handleSubir} loading={subir.isPending}>Subir estudio</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título"
            required
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ej.: Análisis de sangre"
          />
          <Textarea
            label="Descripción"
            hint="Opcional"
            rows={2}
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Observaciones sobre el estudio…"
          />

          <div>
            <p className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Archivo<span className="text-danger ml-0.5">*</span>
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                'w-full rounded-field border-2 border-dashed p-6 text-center transition-colors duration-150',
                archivo
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50',
              )}
            >
              {archivo ? (
                <span className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-800">
                  <IconCheck className="text-brand-600" />
                  <span className="truncate">{archivo.name}</span>
                </span>
              ) : (
                <>
                  <IconUpload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <span className="block text-sm text-slate-600 font-medium">Hacé click para elegir un archivo</span>
                  <span className="block text-xs text-slate-400 mt-1">PDF, JPG o PNG · máx. 10 MB</span>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => handleArchivo(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          {error && <AlertInline>{error}</AlertInline>}
        </div>
      </Dialog>

      {/* Eliminar */}
      <ConfirmDialog
        open={!!aBorrar}
        onClose={() => setABorrar(null)}
        onConfirm={handleEliminar}
        title="Eliminar estudio"
        message={`Se va a eliminar “${aBorrar?.titulo}” y su archivo. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={eliminar.isPending}
      />
    </div>
  );
}
