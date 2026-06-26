import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { apiBaseUrl } from '../../services/api';
import { useMisEstudios, useSubirEstudio } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, Input, Textarea, PageHeader, EmptyState, SkeletonCards,
} from '../../ui';
import { IconDoc, IconImage, IconUpload, IconEye, IconFolder, IconCheck, IconAlert } from '../../ui/icons';
import { listContainer, listItem } from '../../lib/motion';
import { formatFecha } from '../../lib/format';
import { cn } from '../../lib/cn';

const MAX_BYTES = 10 * 1024 * 1024; // límite del backend (multer)
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];

export default function PacienteEstudios() {
  const { data: estudios, isLoading } = useMisEstudios();
  const subir = useSubirEstudio();

  const [modalSubir, setModalSubir] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const cerrarModal = () => {
    setModalSubir(false);
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
    fd.append('archivo', archivo);
    try {
      await subir.mutateAsync(fd);
      toast.success('Estudio subido correctamente');
      cerrarModal();
    } catch (e) {
      setError(apiError(e, 'Error al subir el estudio'));
    }
  };

  const total = estudios?.length ?? 0;

  return (
    <PageTransition>
      <PageHeader
        title="Mis estudios"
        description={total === 1 ? '1 archivo guardado' : `${total} archivos guardados`}
        actions={
          <Button iconLeft={<IconUpload />} onClick={() => setModalSubir(true)}>
            Subir estudio
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : !estudios?.length ? (
        <EmptyState
          icon={<IconFolder />}
          title="Sin estudios"
          description="Subí tus análisis, radiografías o informes y tenelos siempre a mano."
          action={
            <Button iconLeft={<IconUpload />} onClick={() => setModalSubir(true)}>
              Subir mi primer estudio
            </Button>
          }
        />
      ) : (
        <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-3">
          {estudios.map(e => {
            const isPdf = e.tipoArchivo?.toLowerCase() === 'application/pdf' ||
              e.archivoUrl?.toLowerCase().endsWith('.pdf') ||
              e.tipoArchivo?.toLowerCase() === 'pdf';
            return (
              <motion.div key={e.id} variants={listItem}>
                <Card className="p-4 flex items-center gap-4">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl grid place-items-center shrink-0 [&>svg]:w-5 [&>svg]:h-5',
                      isPdf ? 'bg-danger-soft text-danger-text' : 'bg-info-soft text-info-text',
                    )}
                  >
                    {isPdf ? <IconDoc /> : <IconImage />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{e.titulo}</p>
                    {e.descripcion && <p className="text-[13px] text-slate-500 mt-0.5 truncate">{e.descripcion}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      <span className="font-semibold text-slate-500">{isPdf ? 'PDF' : 'Imagen'}</span>
                      {' · '}
                      {formatFecha(e.fecha)}
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<IconEye />}
                    onClick={() => window.open(`${apiBaseUrl}${e.archivoUrl}`, '_blank', 'noopener,noreferrer')}
                  >
                    Ver
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Dialog
        open={modalSubir}
        onClose={cerrarModal}
        title="Subir estudio médico"
        description="PDF, JPG o PNG de hasta 10 MB."
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
            <Button onClick={handleSubir} loading={subir.isPending}>Subir estudio</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-semibold text-slate-700 mb-1.5">Archivo</p>
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

          <Input
            label="Título"
            required
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ej.: Análisis de sangre completo"
          />
          <Textarea
            label="Descripción"
            hint="Opcional"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={2}
            placeholder="Detalles del estudio…"
          />
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
