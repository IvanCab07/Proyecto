import { useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSubirFotoPerfil, useEliminarFotoPerfil } from '../hooks';
import toast from 'react-hot-toast';
import { Avatar, Button, ConfirmDialog, AlertInline, IconCamera, IconTrash } from '../ui';
import { redimensionarImagen } from '../lib/imagen';
import { apiError } from '../lib/apiError';

// El backend solo acepta imágenes; el PDF que sí vale para estudios acá no.
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Avatar del usuario logueado con los controles para cambiar y quitar la foto.
 *
 * Lee el usuario del store, así que no recibe props: lo montan las tres pantallas de cuenta
 * (perfil del paciente, del médico y ajustes del admin).
 */
export function FotoPerfil({ etiquetaRol }: { etiquetaRol?: string }) {
  const user = useAuthStore(s => s.user);
  const subir = useSubirFotoPerfil();
  const eliminar = useEliminarFotoPerfil();

  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const handleArchivo = async (file: File | null) => {
    setError('');
    if (!file) return;

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return setError('Solo se aceptan imágenes JPG, PNG o WEBP');
    }

    try {
      // Se recorta y comprime en el navegador: así nunca se llega al tope de 2 MB del backend,
      // sin importar la cámara con la que se sacó la foto.
      const blob = await redimensionarImagen(file);
      const fd = new FormData();
      fd.append('foto', blob, 'foto.jpg');
      await subir.mutateAsync(fd);
      toast.success('Foto actualizada');
    } catch (e) {
      setError(apiError(e, 'No se pudo subir la foto'));
    } finally {
      // Sin esto, volver a elegir el mismo archivo no dispara onChange.
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleEliminar = async () => {
    setError('');
    try {
      await eliminar.mutateAsync();
      setConfirmarBorrado(false);
      toast.success('Foto eliminada');
    } catch (e) {
      setError(apiError(e, 'No se pudo quitar la foto'));
    }
  };

  return (
    <div className="flex items-end gap-4 -mt-8">
      <div className="relative shrink-0">
        <Avatar
          nombre={user?.nombre}
          apellido={user?.apellido}
          src={user?.fotoUrl}
          size="xl"
          shape="squircle"
          className="ring-4 ring-surface shadow-glow-mint"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={subir.isPending}
          aria-label={user?.fotoUrl ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
          className="absolute -bottom-1 -right-1 grid place-items-center w-7 h-7 rounded-full bg-brand-600 text-white ring-2 ring-surface hover:bg-brand-700 transition-colors disabled:opacity-60"
        >
          <IconCamera className="w-3.5 h-3.5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => handleArchivo(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex-1 min-w-0 pb-1">
        {etiquetaRol && (
          <span className="inline-block px-2.5 py-0.5 rounded-pill bg-brand-50 text-brand-700 text-[11px] font-bold uppercase tracking-widest">
            {etiquetaRol}
          </span>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="secondary"
            size="sm"
            loading={subir.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {user?.fotoUrl ? 'Cambiar foto' : 'Agregar foto'}
          </Button>
          {user?.fotoUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmarBorrado(true)}
              iconLeft={<IconTrash className="w-3.5 h-3.5" />}
            >
              Quitar
            </Button>
          )}
        </div>
        {error && <AlertInline tono="danger" className="mt-2">{error}</AlertInline>}
      </div>

      <ConfirmDialog
        open={confirmarBorrado}
        onClose={() => setConfirmarBorrado(false)}
        onConfirm={handleEliminar}
        title="Quitar foto de perfil"
        message="Vas a volver a mostrar tus iniciales. Podés subir otra foto cuando quieras."
        confirmLabel="Quitar"
        tone="danger"
        loading={eliminar.isPending}
      />
    </div>
  );
}
