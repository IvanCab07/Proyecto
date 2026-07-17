import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconX } from '../ui/icons';

const OPCIONES = [
  {
    id: 'sacar-turno',
    pregunta: '¿Cómo sacar un turno?',
    respuesta: 'Ingresá a “Solicitar turno”, elegí la especialidad, el médico, la fecha y el horario que prefieras. Al confirmar, vas a verlo en Mis turnos.',
  },
  {
    id: 'ver-turnos',
    pregunta: '¿Cómo ver mis turnos?',
    respuesta: 'Abrí “Mis turnos” desde el menú. Ahí podés consultar tus próximos turnos, el historial y el calendario mensual.',
  },
  {
    id: 'cancelar-turno',
    pregunta: '¿Cómo cancelar un turno?',
    respuesta: 'En “Mis turnos”, buscá el turno pendiente y presioná “Cancelar turno”. Si querés, podés indicar el motivo de la cancelación.',
  },
  {
    id: 'subir-estudios',
    pregunta: '¿Cómo subir estudios médicos?',
    respuesta: 'Entrá a “Mis estudios” y seleccioná la opción para subir un archivo. Podés adjuntar el estudio y agregar un título o una breve descripción.',
  },
] as const;

type OpcionId = (typeof OPCIONES)[number]['id'];

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
    </svg>
  );
}

export function ChatSoporte() {
  const [abierto, setAbierto] = useState(false);
  const [opcion, setOpcion] = useState<OpcionId | null>(null);
  const seleccion = OPCIONES.find(item => item.id === opcion);

  const cerrar = () => {
    setAbierto(false);
    setOpcion(null);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {abierto && (
          <motion.section
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            aria-live="polite"
            className="absolute bottom-16 right-0 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl bg-surface shadow-modal ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-4 text-white">
              <div>
                <p className="font-semibold">Soporte</p>
                <p className="mt-0.5 text-[13px] text-brand-100">Estamos para orientarte.</p>
              </div>
              <button onClick={cerrar} aria-label="Cerrar soporte" className="rounded-lg p-1 text-brand-100 hover:bg-white/10 hover:text-white"><IconX /></button>
            </div>
            <div className="p-4">
              {seleccion ? (
                <div>
                  <p className="text-sm leading-relaxed text-slate-700">{seleccion.respuesta}</p>
                  <button onClick={() => setOpcion(null)} className="mt-4 text-[13px] font-semibold text-brand-700 hover:text-brand-800">← Volver al menú principal</button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-800">¡Hola! ¿En qué te puedo ayudar hoy?</p>
                  <div className="mt-3 space-y-2">
                    {OPCIONES.map(item => <button key={item.id} onClick={() => setOpcion(item.id)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800">{item.pregunta}</button>)}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <button
        onClick={() => setAbierto(actual => !actual)}
        aria-label={abierto ? 'Cerrar chat de soporte' : 'Abrir chat de soporte'}
        aria-expanded={abierto}
        className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-glow-brand transition-transform hover:scale-105 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        {abierto ? <IconX className="w-5 h-5" /> : <ChatIcon />}
      </button>
    </div>
  );
}
