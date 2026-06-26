import { useState } from 'react';
import { View, Text, FlatList, RefreshControl, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useMisEstudios, useSubirEstudio } from '../../hooks';
import { getApiUrl } from '../../services/api';
import {
  Card, Button, Input, Textarea, Sheet, ScreenHeader, EmptyState, Skeleton, toast,
  IconFolder, IconUpload, IconFileText, IconImage, IconExternal, IconPlus,
} from '../../components/ui';
import { PressableScale, stagger } from '../../lib/motion';
import { colors } from '../../lib/theme';
import { formatFechaLarga } from '../../lib/format';
import { apiError } from '../../lib/apiError';
import type { Estudio } from '../../services';

const apiBase = () => getApiUrl().replace(/\/api$/, '');

export default function EstudiosScreen() {
  const { data: estudios, isLoading, isRefetching, refetch } = useMisEstudios();
  const subirEstudio = useSubirEstudio();
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const count = estudios?.length ?? 0;

  const resetForm = () => { setShowForm(false); setTitulo(''); setDescripcion(''); setSelectedFile(null); };

  const handleSelectFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled && result.assets.length > 0) setSelectedFile(result.assets[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return toast.error('Seleccioná un archivo primero');
    const formData = new FormData();
    formData.append('titulo', titulo.trim() || selectedFile.name);
    if (descripcion.trim()) formData.append('descripcion', descripcion.trim());
    formData.append('archivo', { uri: selectedFile.uri, name: selectedFile.name, type: selectedFile.mimeType } as any);
    try {
      await subirEstudio.mutateAsync(formData);
      resetForm();
      toast.success('Estudio subido');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo subir el archivo'));
    }
  };

  const handleOpenFile = async (archivoUrl: string) => {
    const url = `${apiBase()}${archivoUrl}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else toast.error('Tu dispositivo no puede abrir este tipo de archivo');
    } catch {
      toast.error('No se pudo abrir el archivo');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        eyebrow="Mis estudios"
        title="Resultados e informes"
        subtitle={`${count} archivo${count !== 1 ? 's' : ''} almacenado${count !== 1 ? 's' : ''}`}
        onBack={() => router.back()}
      />

      <View className="px-4 pt-4">
        <Button fullWidth iconLeft={<IconUpload size={16} color="#fff" />} onPress={() => setShowForm(true)}>
          Subir estudio nuevo
        </Button>
      </View>

      {isLoading ? (
        <View className="p-4 gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-card" />)}</View>
      ) : (
        <FlatList
          data={estudios}
          keyExtractor={e => e.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-10"
              icon={<IconFolder size={28} color={colors.brand[500]} />}
              title="Sin estudios aún"
              message="Subí tus análisis, radiografías e informes para tenerlos siempre a mano."
            />
          }
          renderItem={({ item, index }) => <EstudioCard item={item} index={index} onOpen={() => handleOpenFile(item.archivoUrl)} />}
        />
      )}

      <Sheet visible={showForm} onClose={resetForm} title="Subir nuevo estudio">
        <Input label="Título" placeholder="Ej: Análisis de sangre" value={titulo} onChangeText={setTitulo} className="mb-3" />
        <Textarea label="Descripción (opcional)" placeholder="Notas adicionales…" value={descripcion} onChangeText={setDescripcion} className="mb-3" />
        <PressableScale onPress={handleSelectFile} haptic="select" className="flex-row items-center justify-center gap-2 rounded-field border-[1.5px] border-dashed border-brand-300 bg-brand-50 p-4 mb-4">
          {selectedFile ? <IconFileText size={16} color={colors.brand[600]} /> : <IconPlus size={16} color={colors.brand[600]} />}
          <Text className="text-sm font-semibold text-brand-700" numberOfLines={1}>
            {selectedFile ? selectedFile.name : 'Seleccionar archivo (PDF o imagen)'}
          </Text>
        </PressableScale>
        <View className="flex-row gap-3">
          <View className="flex-1"><Button variant="secondary" fullWidth onPress={resetForm}>Cancelar</Button></View>
          <View className="flex-1"><Button fullWidth loading={subirEstudio.isPending} onPress={handleUpload}>Subir</Button></View>
        </View>
      </Sheet>
    </View>
  );
}

function EstudioCard({ item, index, onOpen }: { item: Estudio; index: number; onOpen: () => void }) {
  const isPdf = item.tipoArchivo?.includes('pdf');
  const tone = isPdf ? colors.danger : colors.info;
  return (
    <Animated.View entering={stagger(index)}>
      <Card className="flex-row items-center p-3.5">
        <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: tone.soft }}>
          {isPdf ? <IconFileText size={20} color={tone.DEFAULT} /> : <IconImage size={20} color={tone.DEFAULT} />}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-900" style={{ letterSpacing: -0.2 }} numberOfLines={1}>{item.titulo}</Text>
          {item.descripcion ? <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>{item.descripcion}</Text> : null}
          <Text className="text-[11px] text-slate-400 mt-1">{formatFechaLarga(item.fecha)}  ·  {isPdf ? 'PDF' : 'Imagen'}</Text>
        </View>
        <PressableScale onPress={onOpen} haptic="select" className="w-9 h-9 rounded-lg items-center justify-center bg-slate-100 ml-2">
          <IconExternal size={16} color={colors.slate[600]} />
        </PressableScale>
      </Card>
    </Animated.View>
  );
}
