import { useRef, useState } from 'react';
import {
  View, Text, Pressable, Modal, FlatList, TextInput,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuthStore';
import { useMisTurnos, useMisRecetas, useMisEstudios } from '../hooks';
import { IconX, IconSend, IconMessage } from './ui';
import { ALTO_TABBAR } from './RoleTabBar';
import { PressableScale } from '../lib/motion';
import { haptic } from '../lib/haptics';
import { useTheme } from '../lib/useTheme';
import { gradients } from '../lib/theme';
import {
  buscarTema, respuestaSinResultado, saludoInicial, TEMAS_DESTACADOS,
  type Accion, type Tema,
} from '../lib/asistente';

interface Mensaje {
  id: string;
  de: 'bot' | 'usuario';
  texto: string;
  acciones?: Accion[];
  /** Temas que se ofrecen cuando no se entendió la consulta. */
  sugerencias?: Tema[];
}

let contador = 0;
const nuevoId = () => `m${++contador}`;

/**
 * Asistente de soporte del paciente: el FAB y el panel.
 *
 * Está montado en el layout de tabs, o sea que existe siempre. Por eso los hooks de datos NO
 * van acá sino dentro de <Panel>, que solo se monta con el chat abierto: si estuvieran acá,
 * cada pestaña del paciente dispararía tres queries por el solo hecho de existir el botón.
 */
export function ChatSoporte() {
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <View className="absolute inset-0" pointerEvents="box-none">
        <PressableScale
          accessibilityLabel="Abrir asistente de soporte"
          accessibilityState={{ expanded: abierto }}
          onPress={() => { haptic.light(); setAbierto(true); }}
          scaleTo={0.9}
          style={{
            position: 'absolute',
            right: 20,
            // Apoyado en el alto real de la tab bar, no en un valor a ojo.
            bottom: insets.bottom + ALTO_TABBAR + 12,
            height: 52,
            width: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.brand[600],
            ...shadow.glowBrand,
          }}
        >
          <IconMessage size={23} color={colors.white} />
        </PressableScale>
      </View>

      {/* Modal y no Sheet: el Sheet ocupa la pantalla entera y su contenido no scrollea, y
          tocarlo para arreglar esto impactaría en los 20+ Sheets que ya existen. */}
      <Modal
        visible={abierto}
        transparent
        animationType="fade"
        onRequestClose={() => setAbierto(false)}
        statusBarTranslucent
      >
        <Panel onCerrar={() => setAbierto(false)} />
      </Modal>
    </>
  );
}

function Panel({ onCerrar }: { onCerrar: () => void }) {
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const listaRef = useRef<FlatList<Mensaje>>(null);

  const user = useAuthStore(s => s.user);
  const { data: turnos } = useMisTurnos();
  const { data: recetas } = useMisRecetas();
  const { data: estudios } = useMisEstudios();

  const [texto, setTexto] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => [
    { id: nuevoId(), de: 'bot', texto: saludoInicial(user?.nombre) },
  ]);

  const contexto = {
    nombre: user?.nombre,
    turnos: turnos ?? [],
    recetas: recetas ?? [],
    estudios: estudios ?? [],
  };

  const responder = (consulta: string) => {
    const limpio = consulta.trim();
    if (!limpio) return;

    const { tema, sugerencias } = buscarTema(limpio);
    const respuesta = tema ? tema.responder(contexto) : respuestaSinResultado(sugerencias);

    setMensajes(prev => [
      ...prev,
      { id: nuevoId(), de: 'usuario', texto: limpio },
      {
        id: nuevoId(),
        de: 'bot',
        texto: respuesta.texto,
        acciones: respuesta.acciones,
        sugerencias: tema ? undefined : sugerencias,
      },
    ]);
    setTexto('');
  };

  const elegirTema = (tema: Tema) => {
    const respuesta = tema.responder(contexto);
    setMensajes(prev => [
      ...prev,
      { id: nuevoId(), de: 'usuario', texto: tema.titulo },
      { id: nuevoId(), de: 'bot', texto: respuesta.texto, acciones: respuesta.acciones },
    ]);
  };

  const irA = (accion: Accion) => {
    haptic.select();
    onCerrar();
    router.push(accion.to as never);
  };

  const anchoPanel = Math.min(width - 32, 380);
  const altoLista = Math.min(height * 0.45, 420);
  const soloSaludo = mensajes.length === 1;

  return (
    <View style={{ flex: 1 }}>
      {/* Fondo: cierra al tocar afuera */}
      <Pressable
        accessibilityLabel="Cerrar asistente"
        onPress={onCerrar}
        style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }}
        pointerEvents="box-none"
      >
        <View
          style={{
            width: anchoPanel,
            marginRight: 16,
            marginBottom: insets.bottom + 16,
            borderRadius: 22,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            ...shadow.modal,
          }}
        >
          {/* Encabezado */}
          <LinearGradient colors={gradients.railCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View className="flex-row items-start justify-between px-4 py-3.5">
              <View className="flex-1 mr-2">
                <Text className="text-rail-fg font-bold text-[16px]">Asistente</Text>
                <Text className="text-rail-fg/70 text-[12px] mt-0.5">Preguntame sobre turnos, recetas o estudios.</Text>
              </View>
              <Pressable accessibilityLabel="Cerrar asistente" onPress={onCerrar} className="p-1">
                <IconX size={18} color={colors.railFg} />
              </Pressable>
            </View>
          </LinearGradient>

          {/* Conversación */}
          <FlatList
            ref={listaRef}
            data={mensajes}
            keyExtractor={m => m.id}
            style={{ maxHeight: altoLista }}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            accessibilityLiveRegion="polite"
            onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <Burbuja mensaje={item} onAccion={irA} onSugerencia={elegirTema} />
            )}
            ListFooterComponent={
              soloSaludo ? <Atajos onElegir={elegirTema} /> : null
            }
          />

          {/* Entrada */}
          <View
            className="flex-row items-center gap-2 px-3 py-2.5 border-t border-slate-100"
            style={{ backgroundColor: colors.surface }}
          >
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribí tu consulta…"
              placeholderTextColor={colors.slate[400]}
              maxLength={200}
              returnKeyType="send"
              onSubmitEditing={() => responder(texto)}
              blurOnSubmit={false}
              style={{
                flex: 1,
                height: 42,
                paddingHorizontal: 14,
                borderRadius: 21,
                backgroundColor: colors.slate[100],
                color: colors.slate[900],
                fontSize: 14,
              }}
            />
            <Pressable
              accessibilityLabel="Enviar consulta"
              disabled={!texto.trim()}
              onPress={() => responder(texto)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: texto.trim() ? colors.brand[600] : colors.slate[200],
              }}
            >
              <IconSend size={18} color={texto.trim() ? colors.white : colors.slate[400]} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Burbuja({ mensaje, onAccion, onSugerencia }: {
  mensaje: Mensaje;
  onAccion: (a: Accion) => void;
  onSugerencia: (t: Tema) => void;
}) {
  const { colors } = useTheme();
  const esUsuario = mensaje.de === 'usuario';

  return (
    <View style={{ alignItems: esUsuario ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          maxWidth: '88%',
          paddingHorizontal: 12,
          paddingVertical: 9,
          borderRadius: 16,
          backgroundColor: esUsuario ? colors.brand[600] : colors.slate[100],
        }}
      >
        <Text
          style={{
            fontSize: 13,
            lineHeight: 19,
            color: esUsuario ? colors.white : colors.slate[700],
          }}
        >
          {mensaje.texto}
        </Text>
      </View>

      {mensaje.acciones?.length ? (
        <View className="flex-row flex-wrap gap-1.5 mt-1.5">
          {mensaje.acciones.map(a => (
            <PressableScale
              key={a.to + a.label}
              onPress={() => onAccion(a)}
              className="rounded-pill bg-brand-50 border border-brand-100 px-3 py-1.5"
            >
              <Text className="text-[12px] font-bold text-brand-700">{a.label}</Text>
            </PressableScale>
          ))}
        </View>
      ) : null}

      {mensaje.sugerencias?.length ? (
        <View className="gap-1.5 mt-1.5" style={{ maxWidth: '88%' }}>
          {mensaje.sugerencias.map(t => (
            <PressableScale
              key={t.id}
              onPress={() => onSugerencia(t)}
              className="rounded-xl border border-slate-200 bg-surface px-3 py-2"
            >
              <Text className="text-[12px] font-medium text-slate-700">{t.titulo}</Text>
            </PressableScale>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Preguntas de arranque, para que no haya que adivinar qué se puede preguntar. */
function Atajos({ onElegir }: { onElegir: (t: Tema) => void }) {
  return (
    <View className="gap-1.5 mt-1">
      <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
        Preguntas frecuentes
      </Text>
      {TEMAS_DESTACADOS.map(t => (
        <PressableScale
          key={t.id}
          onPress={() => onElegir(t)}
          className="rounded-xl border border-slate-200 bg-surface px-3 py-2"
        >
          <Text className="text-[12px] font-medium text-slate-700">{t.titulo}</Text>
        </PressableScale>
      ))}
    </View>
  );
}
