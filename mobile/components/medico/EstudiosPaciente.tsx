import { useState } from 'react';
import { View, Text, FlatList, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSubirEstudio, useEliminarEstudio } from '../../hooks';
import { useAuthStore } from '../../hooks/useAuthStore';
import {
  Button, Input, Textarea, Sheet, confirm, toast,
  IconPlus, IconFileText, IconImage, IconExternal, IconTrash,
} from '../ui';
import { PressableScale } from '../../lib/motion';
import { useTheme } from '../../lib/useTheme';
import { formatFechaCorta } from '../../lib/format';
import { urlArchivo } from '../../lib/archivoUrl';
import { apiError } from '../../lib/apiError';
import { limpiar, LIMITES, validarTituloEstudio, validarDescripcionEstudio } from '../../lib/validaciones';
import type { Estudio } from '../../services';
import type { PacienteRef } from './RecetaForm';

const VACIO = { titulo: '', descripcion: '' };

/**
 * Estudios de un paciente, desde la vista del médico: ver, subir a nombre del paciente y
 * eliminar los que él mismo subió.
 *
 * Espeja web/src/components/medico/EstudiosPaciente.tsx. La regla de borrado es la misma que
 * aplica el backend: el médico solo puede eliminar los estudios con `subidoPorId` propio.
 */
export function EstudiosPaciente({ paciente, estudios }: { paciente: PacienteRef; estudios: Estudio[] }) {
  const { colors } = useTheme();
  const userId = useAuthStore(s => s.user?.id);
  const subir = useSubirEstudio();
  const eliminar = useEliminarEstudio();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [archivo, setArchivo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const cerrar = () => { setModal(false); setForm(VACIO); setArchivo(null); setErrores({}); };

  const elegirArchivo = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!res.canceled && res.assets.length > 0) setArchivo(res.assets[0]);
  };

  const handleSubir = async () => {
    if (!archivo) return toast.error('Elegí un archivo primero');

    // El título es opcional para el backend (usa el nombre del archivo), pero si se escribe
    // uno tiene que ser válido: si no, el 400 llega con el archivo ya guardado en disco.
    const nuevos: Record<string, string> = {};
    const titulo = form.titulo.trim() ? validarTituloEstudio(form.titulo) : undefined;
    const descripcion = validarDescripcionEstudio(form.descripcion);
    if (titulo) nuevos.titulo = titulo;
    if (descripcion) nuevos.descripcion = descripcion;
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    const formData = new FormData();
    formData.append('titulo', limpiar(form.titulo) || archivo.name);
    if (form.descripcion.trim()) formData.append('descripcion', limpiar(form.descripcion));
    // Sin pacienteId el estudio se guardaría a nombre del médico, no del paciente.
    formData.append('pacienteId', paciente.id);
    formData.append('archivo', { uri: archivo.uri, name: archivo.name, type: archivo.mimeType } as any);

    try {
      await subir.mutateAsync(formData);
      cerrar();
      toast.success('Estudio subido');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo subir el archivo'));
    }
  };

  const handleAbrir = async (estudio: Estudio) => {
    const url = urlArchivo(estudio.archivoUrl);
    if (!url) return;
    try {
      const puede = await Linking.canOpenURL(url);
      if (puede) await Linking.openURL(url);
      else toast.error('Tu dispositivo no puede abrir este tipo de archivo');
    } catch {
      toast.error('No se pudo abrir el archivo');
    }
  };

  const handleEliminar = async (estudio: Estudio) => {
    const ok = await confirm({
      title: 'Eliminar estudio',
      message: `Se va a eliminar “${estudio.titulo}” y su archivo. No se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await eliminar.mutateAsync(estudio.id);
      toast.success('Estudio eliminado');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo eliminar el estudio'));
    }
  };

  return (
    <>
      <Button
        fullWidth
        size="sm"
        iconLeft={<IconPlus size={15} color="#fff" />}
        onPress={() => { setForm(VACIO); setArchivo(null); setModal(true); }}
        className="mb-3"
      >
        Subir estudio
      </Button>

      {estudios.length === 0 ? (
        <Text className="text-sm text-slate-400 py-6 text-center">Sin estudios cargados.</Text>
      ) : (
        <FlatList
          data={estudios}
          keyExtractor={e => e.id}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => {
            const esImagen = item.tipoArchivo?.startsWith('image/');
            // El backend rechaza el borrado si no lo subió este médico; ocultamos el botón
            // para no ofrecer una acción que va a fallar con 403.
            const puedeBorrar = !!userId && item.subidoPorId === userId;

            return (
              <View className="rounded-field border border-slate-100 p-3">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-9 h-9 rounded-lg items-center justify-center" style={{ backgroundColor: esImagen ? colors.info.soft : colors.danger.soft }}>
                    {esImagen
                      ? <IconImage size={16} color={colors.info.text} />
                      : <IconFileText size={16} color={colors.danger.text} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-slate-900" numberOfLines={1}>{item.titulo}</Text>
                    <Text className="text-[11px] text-slate-400">
                      {formatFechaCorta(item.fecha)}{puedeBorrar ? ' · lo subiste vos' : ''}
                    </Text>
                  </View>
                </View>

                {item.descripcion ? (
                  <Text className="text-[12px] text-slate-600 mt-2">{item.descripcion}</Text>
                ) : null}

                <View className="flex-row gap-2 mt-2.5">
                  <PressableScale
                    fill
                    onPress={() => handleAbrir(item)}
                    haptic="select"
                    className="flex-row items-center justify-center gap-1.5 rounded-lg py-2 bg-brand-50 border border-brand-100"
                  >
                    <IconExternal size={13} color={colors.brand[700]} />
                    <Text className="text-[12px] font-bold text-brand-700">Ver</Text>
                  </PressableScale>

                  {puedeBorrar ? (
                    <PressableScale
                      onPress={() => handleEliminar(item)}
                      haptic="warning"
                      accessibilityLabel={`Eliminar ${item.titulo}`}
                      className="items-center justify-center rounded-lg px-3 py-2 bg-danger-soft border border-danger/20"
                    >
                      <IconTrash size={13} color={colors.danger.text} />
                    </PressableScale>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      <Sheet visible={modal} onClose={cerrar} title="Subir estudio">
        <Text className="text-[13px] text-slate-400 mb-3">
          Para {paciente.nombre} {paciente.apellido}
        </Text>

        <PressableScale
          onPress={elegirArchivo}
          haptic="select"
          className="rounded-field border border-dashed border-slate-300 py-5 items-center mb-3"
        >
          <IconFileText size={20} color={colors.slate[400]} />
          <Text className="text-[13px] font-semibold text-slate-700 mt-1.5" numberOfLines={1}>
            {archivo ? archivo.name : 'Seleccionar archivo'}
          </Text>
          <Text className="text-[11px] text-slate-400 mt-0.5">PDF, JPG o PNG · hasta 10 MB</Text>
        </PressableScale>

        <Input
          label="Título"
          hint="Opcional · si lo dejás vacío usamos el nombre del archivo"
          value={form.titulo}
          onChangeText={v => { setForm(f => ({ ...f, titulo: v })); setErrores(e => ({ ...e, titulo: '' })); }}
          error={errores.titulo || undefined}
          maxLength={LIMITES.tituloEstudio}
          placeholder="Ej: Radiografía de tórax"
          className="mb-3"
        />
        <Textarea
          label="Descripción"
          hint="Opcional"
          value={form.descripcion}
          onChangeText={v => { setForm(f => ({ ...f, descripcion: v })); setErrores(e => ({ ...e, descripcion: '' })); }}
          error={errores.descripcion || undefined}
          maxLength={LIMITES.descripcionEstudio}
          placeholder="Observaciones del estudio…"
          className="mb-4"
        />

        <Button fullWidth loading={subir.isPending} onPress={handleSubir}>Subir estudio</Button>
      </Sheet>
    </>
  );
}
