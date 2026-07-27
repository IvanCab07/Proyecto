import { View, Text, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../hooks/useAuthStore';
import { useSubirFotoPerfil, useEliminarFotoPerfil } from '../hooks';
import { Avatar, actionSheet, confirm, toast, IconCamera } from './ui';
import { PressableScale } from '../lib/motion';
import { useTheme } from '../lib/useTheme';
import { apiError } from '../lib/apiError';

/**
 * Avatar del usuario logueado con el botón de cámara para cambiar o quitar la foto.
 *
 * Lee el usuario del store, así que no recibe props de datos: se puede montar en cualquier
 * pantalla de cuenta (perfil del paciente, del médico, ajustes del admin).
 */
export function FotoPerfilPicker({ size = 80 }: { size?: number }) {
  const { colors, shadow } = useTheme();
  const user = useAuthStore(s => s.user);
  const subir = useSubirFotoPerfil();
  const eliminar = useEliminarFotoPerfil();
  const ocupado = subir.isPending || eliminar.isPending;

  // El recorte cuadrado y la compresión los hace el picker nativo: así el archivo que sale de
  // acá nunca se acerca al tope de 2 MB del backend.
  const OPCIONES = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.7 };

  const enviar = async (uri: string) => {
    const formData = new FormData();
    // El backend espera el campo "foto" (lo exige uploadImagen.middleware). El nombre y el
    // tipo son fijos porque el picker ya nos devolvió un JPEG recortado.
    formData.append('foto', { uri, name: 'foto.jpg', type: 'image/jpeg' } as any);
    try {
      await subir.mutateAsync(formData);
      toast.success('Foto actualizada');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo subir la foto'));
    }
  };

  const desdeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return toast.error('Necesitamos permiso para acceder a tus fotos');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], ...OPCIONES });
    if (!res.canceled && res.assets[0]) await enviar(res.assets[0].uri);
  };

  const desdeCamara = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return toast.error('Necesitamos permiso para usar la cámara');
    const res = await ImagePicker.launchCameraAsync(OPCIONES);
    if (!res.canceled && res.assets[0]) await enviar(res.assets[0].uri);
  };

  const quitar = async () => {
    const ok = await confirm({
      title: 'Quitar foto de perfil',
      message: 'Vas a volver a mostrar tus iniciales. Podés subir otra foto cuando quieras.',
      confirmText: 'Quitar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await eliminar.mutateAsync();
      toast.success('Foto eliminada');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo quitar la foto'));
    }
  };

  const abrirMenu = () => {
    actionSheet({
      title: user?.fotoUrl ? 'Cambiar foto de perfil' : 'Agregar foto de perfil',
      options: [
        { label: 'Elegir de la galería', onPress: desdeGaleria },
        { label: 'Tomar una foto', onPress: desdeCamara },
        ...(user?.fotoUrl ? [{ label: 'Quitar foto', onPress: quitar, destructive: true }] : []),
      ],
    });
  };

  return (
    <PressableScale
      onPress={abrirMenu}
      haptic="select"
      disabled={ocupado}
      accessibilityLabel={user?.fotoUrl ? 'Cambiar tu foto de perfil' : 'Agregar una foto de perfil'}
    >
      <View style={{ width: size, height: size }}>
        <Avatar nombre={user?.nombre} apellido={user?.apellido} uri={user?.fotoUrl} size={size} shape="squircle" />

        {ocupado ? (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: colors.scrim, borderRadius: Math.round(size * 0.28) }}
          >
            <ActivityIndicator size="small" color={colors.white} />
          </View>
        ) : (
          <View
            className="absolute -bottom-1 -right-1 items-center justify-center rounded-full border-2 border-surface"
            style={{ width: 28, height: 28, backgroundColor: colors.brand[600], ...shadow.xs }}
          >
            <IconCamera size={14} color={colors.white} />
          </View>
        )}
      </View>
    </PressableScale>
  );
}

/** Texto de ayuda al lado del avatar. Aparte para que cada pantalla lo ubique donde quiera. */
export function FotoPerfilAyuda() {
  return <Text className="text-[12px] text-slate-400">Tocá la foto para cambiarla</Text>;
}
