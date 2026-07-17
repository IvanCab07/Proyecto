import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { IconInfo, IconX } from './ui';
import { colors, shadow } from '../lib/theme';

const OPCIONES = [
  {
    id: 'sacar-turno',
    pregunta: '¿Cómo sacar un turno?',
    respuesta: 'Entrá a Solicitar turno, elegí la especialidad, el médico, la fecha y el horario. Al confirmar, vas a verlo en Turnos.',
  },
  {
    id: 'ver-turnos',
    pregunta: '¿Cómo ver mis turnos?',
    respuesta: 'Abrí la pestaña Turnos. Ahí podés revisar los próximos, el historial y el calendario mensual.',
  },
  {
    id: 'cancelar-turno',
    pregunta: '¿Cómo cancelar un turno?',
    respuesta: 'En Turnos, buscá el turno pendiente y elegí Cancelar turno. También podés indicar el motivo de la cancelación.',
  },
  {
    id: 'subir-estudios',
    pregunta: '¿Cómo subir estudios médicos?',
    respuesta: 'Entrá a Estudios, elegí subir un archivo y completá el título o una breve descripción antes de confirmar.',
  },
] as const;

type OpcionId = (typeof OPCIONES)[number]['id'];

export function ChatSoporte() {
  const [abierto, setAbierto] = useState(false);
  const [opcion, setOpcion] = useState<OpcionId | null>(null);
  const seleccion = OPCIONES.find(item => item.id === opcion);

  const cerrar = () => {
    setAbierto(false);
    setOpcion(null);
  };

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      {abierto ? (
        <View className="absolute right-5 bottom-28 w-[300px] rounded-2xl bg-white overflow-hidden" style={shadow.pop}>
          <View className="flex-row items-start justify-between bg-brand-600 px-4 py-3.5">
            <View className="flex-1 mr-2">
              <Text className="text-white font-bold text-[16px]">Soporte</Text>
              <Text className="text-brand-100 text-[12px] mt-0.5">Estamos para orientarte.</Text>
            </View>
            <Pressable accessibilityLabel="Cerrar soporte" onPress={cerrar} className="p-1">
              <IconX size={18} color="#fff" />
            </Pressable>
          </View>
          <View className="p-4">
            {seleccion ? (
              <View>
                <Text className="text-[13px] leading-5 text-slate-700">{seleccion.respuesta}</Text>
                <Pressable onPress={() => setOpcion(null)} className="mt-4 self-start">
                  <Text className="text-[13px] font-bold text-brand-700">← Volver al menú principal</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text className="text-[14px] font-semibold text-slate-800">¡Hola! ¿En qué te puedo ayudar hoy?</Text>
                <View className="gap-2 mt-3">
                  {OPCIONES.map(item => (
                    <Pressable key={item.id} onPress={() => setOpcion(item.id)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <Text className="text-[13px] font-medium text-slate-700">{item.pregunta}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      ) : null}

      <Pressable
        accessibilityLabel={abierto ? 'Cerrar chat de soporte' : 'Abrir chat de soporte'}
        accessibilityState={{ expanded: abierto }}
        onPress={() => setAbierto(actual => !actual)}
        className="absolute right-5 bottom-9 h-14 w-14 rounded-full items-center justify-center bg-brand-600"
        style={shadow.glowBrand}
      >
        {abierto ? <IconX size={23} color="#fff" /> : <IconInfo size={25} color="#fff" />}
      </Pressable>
    </View>
  );
}
