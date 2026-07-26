import { useState, useRef, useMemo } from 'react';
import type { DragEvent } from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { apiError } from '../../lib/apiError';
import { apiBaseUrl } from '../../services/api';
import { useMisEstudios, useSubirEstudio, useEliminarEstudio } from '../../hooks';
import { PageTransition } from '../../components/PageTransition';
import {
  Card, Button, Dialog, ConfirmDialog, Input, Textarea, PageHeader, EmptyState,
  SkeletonCards, SearchInput, Tabs, AlertInline,
} from '../../ui';
import {
  IconDoc, IconImage, IconUpload, IconEye, IconFolder, IconCheck, IconTrash,
} from '../../ui/icons';
import { listContainer, listItem } from '../../lib/motion';
import { formatFecha } from '../../lib/format';
import { useFormulario } from '../../lib/useFormulario';
import {
  LIMITES, limpiar, normalizar, validarTituloEstudio, validarDescripcionEstudio,
} from '../../lib/validaciones';
import { cn } from '../../lib/cn';
import type { Estudio } from '../../services';

const MAX_BYTES = 10 * 1024 * 1024; // límite del backend (multer)
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];

/** Un estudio es PDF si lo dice el MIME o, para los históricos sin MIME, la extensión. */
function esPdf(e: Estudio): boolean {
  const tipo = e.tipoArchivo?.toLowerCase();
  return tipo === 'application/pdf' || tipo === 'pdf' || !!e.archivoUrl?.toLowerCase().endsWith('.pdf');
}

export default function PacienteEstudios() {
  const { data: estudios, isLoading } = useMisEstudios();
  const subir = useSubirEstudio();
  const eliminar = useEliminarEstudio();

  const [modalSubir, setModalSubir] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tab, setTab] = useState('todos');
  const [aBorrar, setABorrar] = useState<Estudio | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // El título y la descripción pasan por el mismo sistema que el resto de los formularios,
  // así el error sale abajo del campo y no como un cartel genérico al final.
  const form = useFormulario(
    { titulo: '', descripcion: '' },
    { titulo: validarTituloEstudio, descripcion: validarDescripcionEstudio },
  );

  const { pdfs, imagenes, visibles } = useMemo(() => {
    const lista = estudios ?? [];
    const pdfs = lista.filter(esPdf);
    const imagenes = lista.filter(e => !esPdf(e));

    const porTab = tab === 'pdf' ? pdfs : tab === 'imagen' ? imagenes : lista;

    const q = normalizar(busqueda);
    const visibles = q
      ? porTab.filter(e => normalizar(`${e.titulo} ${e.descripcion ?? ''}`).includes(q))
      : porTab;

    return { pdfs, imagenes, visibles };
  }, [estudios, tab, busqueda]);

  const cerrarModal = () => {
    setModalSubir(false);
    setArchivo(null);
    setArrastrando(false);
    setError('');
    form.reiniciar();
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

  // La zona punteada ya parecía aceptar arrastrar un archivo, pero solo respondía al click.
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
    handleArchivo(e.dataTransfer.files?.[0] ?? null);
  };

  const handleSubir = async () => {
    setError('');
    // Se valida el archivo aparte porque no es un campo del formulario.
    if (!archivo) return setError('Elegí un archivo para subir');
    if (!form.validarTodo()) return;

    const fd = new FormData();
    fd.append('titulo', limpiar(form.valores.titulo));
    const descripcion = limpiar(form.valores.descripcion);
    if (descripcion) fd.append('descripcion', descripcion);
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
      ) : !total ? (
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
        <>
          {/* Los filtros aparecen recién cuando hay unos cuantos: con dos archivos, buscar
              y filtrar es más ruido que ayuda. */}
          {total > 3 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'todos',  label: 'Todos',     count: total },
                  { id: 'pdf',    label: 'PDF',       count: pdfs.length },
                  { id: 'imagen', label: 'Imágenes',  count: imagenes.length },
                ]}
              />
              <SearchInput
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por título o descripción…"
                className="sm:max-w-xs sm:ml-auto"
              />
            </div>
          )}

          {visibles.length === 0 ? (
            <Card>
              <EmptyState
                icon={<IconFolder />}
                title="Sin resultados"
                description="Ningún estudio coincide con lo que buscaste."
              />
            </Card>
          ) : (
            <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-3">
              {visibles.map(e => (
                <motion.div key={e.id} variants={listItem}>
                  <EstudioCard
                    estudio={e}
                    onVer={() => window.open(`${apiBaseUrl}${e.archivoUrl}`, '_blank', 'noopener,noreferrer')}
                    onEliminar={() => setABorrar(e)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
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
            <div
              onDragOver={e => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={handleDrop}
            >
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'w-full rounded-field border-2 border-dashed p-6 text-center transition-colors duration-150',
                  arrastrando
                    ? 'border-brand-500 bg-brand-50'
                    : archivo
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
                    <span className="block text-sm text-slate-600 font-medium">
                      {arrastrando ? 'Soltá el archivo acá' : 'Arrastrá un archivo o hacé click para elegirlo'}
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">PDF, JPG o PNG · máx. 10 MB</span>
                  </>
                )}
              </button>
            </div>
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
            maxLength={LIMITES.tituloEstudio}
            placeholder="Ej.: Análisis de sangre completo"
            {...form.campo('titulo')}
          />
          <Textarea
            label="Descripción"
            hint="Opcional"
            maxLength={LIMITES.descripcionEstudio}
            rows={2}
            placeholder="Detalles del estudio…"
            {...form.campo('descripcion')}
          />
          {error && <AlertInline>{error}</AlertInline>}
        </div>
      </Dialog>

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
    </PageTransition>
  );
}

function EstudioCard({
  estudio, onVer, onEliminar,
}: {
  estudio: Estudio;
  onVer: () => void;
  onEliminar: () => void;
}) {
  const pdf = esPdf(estudio);

  return (
    <Card className="p-4 flex items-center gap-4">
      <div
        className={cn(
          'w-11 h-11 rounded-xl grid place-items-center shrink-0 [&>svg]:w-5 [&>svg]:h-5',
          pdf ? 'bg-danger-soft text-danger-text' : 'bg-info-soft text-info-text',
        )}
      >
        {pdf ? <IconDoc /> : <IconImage />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{estudio.titulo}</p>
        {estudio.descripcion && (
          <p className="text-[13px] text-slate-500 mt-0.5 truncate">{estudio.descripcion}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">
          <span className="font-semibold text-slate-500">{pdf ? 'PDF' : 'Imagen'}</span>
          {' · '}
          {formatFecha(estudio.fecha)}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button variant="secondary" size="sm" iconLeft={<IconEye />} onClick={onVer}>
          Ver
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Eliminar ${estudio.titulo}`}
          className="text-danger hover:bg-danger-soft"
          onClick={onEliminar}
        >
          <IconTrash />
        </Button>
      </div>
    </Card>
  );
}
