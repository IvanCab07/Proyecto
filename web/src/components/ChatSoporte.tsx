import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useMisTurnos, useMisRecetas, useMisEstudios } from '../hooks';
import {
  TEMAS, CATEGORIAS, buscarTema, respuestaSinResultado, saludoInicial,
} from '../lib/asistente';
import type { Accion, ContextoPaciente, Tema } from '../lib/asistente';
import { IconX, IconChat, IconSend } from '../ui/icons';
import { cn } from '../lib/cn';

// Asistente de soporte del portal del paciente.
//
// Antes era un menú de cuatro preguntas fijas sin campo de texto: si tu duda no era una de
// esas cuatro, no había salida. Ahora se puede escribir la consulta y el buscador de
// lib/asistente.ts elige el tema que mejor responde. No hay IA detrás (ver el comentario de
// ese archivo): es un índice de palabras clave, así que responde al instante, no cuesta nada
// y no puede inventar nada, que en salud es lo que importa.
//
// Las respuestas que dependen de los datos del paciente salen de los mismos hooks que usan
// las páginas, así que nunca dicen algo distinto de lo que se ve en pantalla.

interface Mensaje {
  id: number;
  autor: 'bot' | 'usuario';
  texto: string;
  acciones?: Accion[];
  /** Temas ofrecidos cuando no se entendió la consulta. */
  sugerencias?: Tema[];
}

export function ChatSoporte() {
  const [abierto, setAbierto] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  const cerrar = () => {
    setAbierto(false);
    // El foco vuelve al botón que abrió el panel: si no, al cerrar con Escape queda en el
    // body y quien navega con teclado tiene que recorrer la página entera de nuevo.
    fabRef.current?.focus();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {/* El panel se monta recién al abrirlo: adentro pide turnos, recetas y estudios, y no
            tiene sentido que eso corra en cada página solo por tener el botón en pantalla. */}
        {abierto && <Panel onCerrar={cerrar} />}
      </AnimatePresence>

      <button
        ref={fabRef}
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
        aria-label={abierto ? 'Cerrar el asistente' : 'Abrir el asistente'}
        aria-expanded={abierto}
        className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-glow-brand transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-canvas"
      >
        {abierto ? <IconX className="w-5 h-5" /> : <IconChat className="w-6 h-6" />}
      </button>
    </div>
  );
}

function Panel({ onCerrar }: { onCerrar: () => void }) {
  const user = useAuthStore(s => s.user);
  const { data: turnos } = useMisTurnos();
  const { data: recetas } = useMisRecetas();
  const { data: estudios } = useMisEstudios();
  const navigate = useNavigate();

  const [mensajes, setMensajes] = useState<Mensaje[]>(() => [
    { id: 0, autor: 'bot', texto: saludoInicial(user?.nombre) },
  ]);
  const [entrada, setEntrada] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const siguienteId = useRef(1);

  const contexto: ContextoPaciente = useMemo(() => ({
    nombre: user?.nombre,
    turnos: turnos ?? [],
    recetas: recetas ?? [],
    estudios: estudios ?? [],
  }), [user, turnos, recetas, estudios]);

  // Cerrar con Escape, igual que el command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  // El foco al campo de texto apenas abre, para poder escribir sin tocar nada más.
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  // Cada mensaje nuevo baja la conversación hasta el final.
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [mensajes]);

  /**
   * Agrega la consulta y su respuesta a la conversación.
   *
   * `tema` viene cargado cuando el usuario tocó un atajo o una sugerencia: en ese caso ya
   * sabemos qué responder y no hay nada que buscar.
   */
  const responder = (consulta: string, tema?: Tema) => {
    const { tema: encontrado, sugerencias } = tema
      ? { tema, sugerencias: [] as Tema[] }
      : buscarTema(consulta);

    const respuesta = encontrado
      ? encontrado.responder(contexto)
      : respuestaSinResultado(sugerencias);

    setMensajes(actual => [
      ...actual,
      { id: siguienteId.current++, autor: 'usuario', texto: consulta },
      {
        id: siguienteId.current++,
        autor: 'bot',
        texto: respuesta.texto,
        acciones: respuesta.acciones,
        sugerencias: encontrado ? undefined : sugerencias,
      },
    ]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const consulta = entrada.trim();
    if (!consulta) return;
    setEntrada('');
    responder(consulta);
  };

  const irA = (to: string) => {
    navigate(to);
    onCerrar();
  };

  // Solo al principio: una vez que la conversación arrancó, los atajos estorban.
  const mostrarAtajos = mensajes.length === 1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      role="dialog"
      aria-label="Asistente de soporte"
      className="absolute bottom-16 right-0 flex max-h-[min(32rem,calc(100vh-8rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-surface shadow-modal ring-1 ring-slate-200"
    >
      <header className="flex items-start justify-between gap-3 gradient-card px-4 py-3.5 text-rail-fg">
        <div>
          <p className="font-semibold">Asistente</p>
          <p className="mt-0.5 text-[13px] text-rail-fg/70">Preguntame sobre turnos, recetas o estudios.</p>
        </div>
        <button
          onClick={onCerrar}
          aria-label="Cerrar el asistente"
          className="rounded-lg p-1 text-rail-fg/70 hover:bg-white/10 hover:text-rail-fg focus:outline-none focus:ring-2 focus:ring-rail-fg/40"
        >
          <IconX />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {mensajes.map(m => (
          <Burbuja key={m.id} mensaje={m} onAccion={irA} onSugerencia={tema => responder(tema.titulo, tema)} />
        ))}

        {mostrarAtajos && <Atajos onElegir={tema => responder(tema.titulo, tema)} />}

        <div ref={finRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          ref={inputRef}
          value={entrada}
          onChange={e => setEntrada(e.target.value)}
          placeholder="Escribí tu consulta…"
          aria-label="Tu consulta"
          maxLength={200}
          className="min-w-0 flex-1 rounded-field bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!entrada.trim()}
          aria-label="Enviar consulta"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-field bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          <IconSend />
        </button>
      </form>
    </motion.section>
  );
}

function Burbuja({
  mensaje, onAccion, onSugerencia,
}: {
  mensaje: Mensaje;
  onAccion: (to: string) => void;
  onSugerencia: (tema: Tema) => void;
}) {
  const propio = mensaje.autor === 'usuario';

  return (
    <div className={cn('flex', propio && 'justify-end')}>
      <div className={cn('max-w-[85%]', propio && 'text-right')}>
        <p
          className={cn(
            'inline-block rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed',
            propio
              ? 'rounded-br-md bg-brand-600 text-white'
              : 'rounded-bl-md bg-slate-100 text-slate-700',
          )}
        >
          {mensaje.texto}
        </p>

        {/* Los botones navegan de verdad: antes las respuestas decían "entrá a Solicitar
            turno" como texto plano y había que buscarlo a mano en el menú. */}
        {mensaje.acciones && mensaje.acciones.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mensaje.acciones.map(a => (
              <button
                key={a.to}
                onClick={() => onAccion(a.to)}
                className="rounded-pill bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-800 transition-colors hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {a.label} →
              </button>
            ))}
          </div>
        )}

        {mensaje.sugerencias && mensaje.sugerencias.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {mensaje.sugerencias.map(t => (
              <button
                key={t.id}
                onClick={() => onSugerencia(t)}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-[12px] font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {t.titulo}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Atajos del arranque: un tema representativo por categoría, para no empezar con la nada. */
function Atajos({ onElegir }: { onElegir: (tema: Tema) => void }) {
  const destacados = useMemo(
    () => (Object.keys(CATEGORIAS) as (keyof typeof CATEGORIAS)[])
      .map(cat => TEMAS.find(t => t.categoria === cat))
      .filter((t): t is Tema => !!t),
    [],
  );

  return (
    <div className="pt-1">
      <p className="mb-2 text-[12px] font-medium text-slate-400">O elegí un tema:</p>
      <div className="space-y-1.5">
        {destacados.map(t => (
          <button
            key={t.id}
            onClick={() => onElegir(t)}
            className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {t.titulo}
          </button>
        ))}
      </div>
    </div>
  );
}
