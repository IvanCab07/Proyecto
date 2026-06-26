import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useCommandStore } from '../store/useCommandStore';
import { usePacientes, useTodosMedicos } from '../hooks';
import { navFor, flatNav } from '../lib/nav';
import { overlayFade, dialogPop } from '../lib/motion';
import { cn } from '../lib/cn';
import {
  IconSearch, IconCornerDownLeft, IconArrowRight, IconUser, IconStethoscope,
} from '../ui/icons';

export interface CmdItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: ReactNode;
  to?: string;
  onRun?: () => void;
  searchOnly?: boolean; // solo aparece cuando hay texto de búsqueda
}

function CommandBody({ items, onClose }: { items: CmdItem[]; onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  // Solo efectos sobre sistemas externos: foco y bloqueo de scroll.
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.filter(i => !i.searchOnly);
    return items.filter(i => `${i.label} ${i.hint ?? ''}`.toLowerCase().includes(q));
  }, [items, query]);

  const groups = useMemo(() => {
    const map = new Map<string, { item: CmdItem; index: number }[]>();
    filtered.forEach((item, index) => {
      const arr = map.get(item.group);
      const entry = { item, index };
      if (arr) arr.push(entry);
      else map.set(item.group, [entry]);
    });
    return [...map.entries()];
  }, [filtered]);

  const run = (item: CmdItem) => {
    onClose();
    if (item.onRun) item.onRun();
    else if (item.to) navigate(item.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const item = filtered[active]; if (item) run(item); }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <motion.div
        variants={overlayFade}
        initial="hidden" animate="visible" exit="hidden"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-start justify-center p-4 pt-[12vh] pointer-events-none">
        <motion.div
          variants={dialogPop}
          initial="hidden" animate="visible" exit="exit"
          role="dialog" aria-modal="true" aria-label="Buscador global"
          onKeyDown={onKeyDown}
          className="pointer-events-auto w-full max-w-xl bg-surface rounded-card shadow-modal overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 border-b border-slate-100">
            <IconSearch className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActive(0); }}
              placeholder="Buscar páginas, pacientes, médicos…"
              className="flex-1 h-14 bg-transparent outline-none text-[15px] text-slate-900 placeholder:text-slate-400"
            />
            <kbd className="hidden sm:inline-flex items-center h-6 px-1.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">ESC</kbd>
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">
                Sin resultados para “{query}”.
              </p>
            ) : (
              groups.map(([group, entries]) => (
                <div key={group} className="px-2 pb-1">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group}</p>
                  {entries.map(({ item, index }) => {
                    const isActive = index === active;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseMove={() => setActive(index)}
                        onClick={() => run(item)}
                        className={cn(
                          'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors duration-100',
                          isActive ? 'bg-brand-50' : 'hover:bg-slate-50',
                        )}
                      >
                        <span className={cn(
                          'w-8 h-8 rounded-lg grid place-items-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]',
                          isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
                        )}>
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-800 truncate">{item.label}</span>
                          {item.hint && <span className="block text-xs text-slate-400 truncate">{item.hint}</span>}
                        </span>
                        {isActive
                          ? <IconCornerDownLeft className="w-4 h-4 text-brand-600 shrink-0" />
                          : <IconArrowRight className="w-4 h-4 text-slate-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CommandDialog({ items }: { items: CmdItem[] }) {
  const open = useCommandStore(s => s.open);
  const setOpen = useCommandStore(s => s.setOpen);
  const toggle = useCommandStore(s => s.toggle);

  // Atajo global ⌘K / Ctrl+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  return createPortal(
    <AnimatePresence>
      {open && <CommandBody key="cmd" items={items} onClose={() => setOpen(false)} />}
    </AnimatePresence>,
    document.body,
  );
}

function PatientCommand() {
  const items = useMemo<CmdItem[]>(() =>
    flatNav(navFor('PATIENT')).map<CmdItem>(n => ({
      id: `nav-${n.to}`, label: n.label, group: 'Ir a', icon: <n.icon />, to: n.to,
    })),
  []);
  return <CommandDialog items={items} />;
}

function AdminCommand() {
  const { data: pacientes } = usePacientes();
  const { data: medicos } = useTodosMedicos();

  const items = useMemo<CmdItem[]>(() => {
    const nav = flatNav(navFor('ADMIN')).map<CmdItem>(n => ({
      id: `nav-${n.to}`, label: n.label, group: 'Ir a', icon: <n.icon />, to: n.to,
    }));
    const pac = (pacientes ?? []).map<CmdItem>(p => ({
      id: `pac-${p.id}`, label: `${p.nombre} ${p.apellido}`, hint: `DNI ${p.dni}`,
      group: 'Pacientes', icon: <IconUser />, to: '/admin/pacientes', searchOnly: true,
    }));
    const med = (medicos ?? []).map<CmdItem>(m => ({
      id: `med-${m.id}`, label: `Dr. ${m.nombre} ${m.apellido}`, hint: m.especialidad.nombre,
      group: 'Médicos', icon: <IconStethoscope />, to: '/admin/medicos', searchOnly: true,
    }));
    return [...nav, ...pac, ...med];
  }, [pacientes, medicos]);

  return <CommandDialog items={items} />;
}

export function CommandPalette() {
  const role = useAuthStore(s => s.user?.role);
  return role === 'ADMIN' ? <AdminCommand /> : <PatientCommand />;
}
