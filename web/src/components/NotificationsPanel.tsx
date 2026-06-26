import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications, useUnreadCount, useMarkAllNotifRead, useMarkNotifRead } from '../hooks';
import type { Notification, NotificationType } from '../services';
import { panelScale } from '../lib/motion';
import { formatFecha } from '../lib/format';
import { cn } from '../lib/cn';
import { IconBell, IconClock, IconX, IconCalendar, IconPill, IconCheckCircle } from '../ui/icons';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONE: Record<Tone, string> = {
  brand:   'bg-brand-100 text-brand-700',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger:  'bg-danger-soft text-danger-text',
  info:    'bg-info-soft text-info-text',
};

// Cada tipo de notificación → su ícono y color
const META: Record<NotificationType, { tone: Tone; icon: ReactNode }> = {
  TURNO_SOLICITADO: { tone: 'warning', icon: <IconClock /> },
  TURNO_CONFIRMADO: { tone: 'brand',   icon: <IconCalendar /> },
  TURNO_CANCELADO:  { tone: 'danger',  icon: <IconX /> },
  TURNO_COMPLETADO: { tone: 'success', icon: <IconCheckCircle /> },
  RECETA_NUEVA:     { tone: 'success', icon: <IconPill /> },
};

function desde(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return formatFecha(iso);
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const { data: items = [] } = useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const markAll = useMarkAllNotifRead();
  const markOne = useMarkNotifRead();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread > 0) markAll.mutate(); // al abrir, todo queda visto
  };

  const handleItem = (n: Notification) => {
    setOpen(false);
    if (!n.leida) markOne.mutate(n.id);
    const link = n.data?.link;
    if (link) navigate(link);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notificaciones (${unread} sin leer)` : 'Notificaciones'}
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150"
      >
        <IconBell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold grid place-items-center ring-2 ring-canvas tnum">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={panelScale}
            initial="hidden" animate="visible" exit="hidden"
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface rounded-card shadow-pop ring-1 ring-slate-200/70 overflow-hidden z-40"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
              {unread > 0 && (
                <button onClick={() => markAll.mutate()} className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors">
                  Marcar leído
                </button>
              )}
            </div>

            <div className="max-h-[min(60vh,380px)] overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center text-center px-6 py-10">
                  <span className="w-11 h-11 rounded-full bg-brand-50 text-brand-500 grid place-items-center mb-3">
                    <IconCheckCircle className="w-5 h-5" />
                  </span>
                  <p className="text-sm font-medium text-slate-700">Todo al día</p>
                  <p className="text-xs text-slate-400 mt-0.5">No tenés novedades por ahora.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {items.map(n => {
                    const meta = META[n.type];
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleItem(n)}
                          className={cn(
                            'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-100',
                            !n.leida && 'bg-brand-50/40',
                          )}
                        >
                          <span className={cn('w-8 h-8 rounded-lg grid place-items-center shrink-0 [&>svg]:w-4 [&>svg]:h-4', TONE[meta.tone])}>
                            {meta.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold text-slate-800">{n.titulo}</span>
                            <span className="block text-xs text-slate-500 line-clamp-2">{n.mensaje}</span>
                            <span className="block text-[11px] text-slate-400 mt-0.5">{desde(n.createdAt)}</span>
                          </span>
                          {!n.leida && <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1.5" aria-hidden="true" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
