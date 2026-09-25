import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { useSidebarStore } from '../store/useSidebarStore';
import { useReenviarVerificacion } from '../hooks';
import { apiError } from '../lib/apiError';
import { cn } from '../lib/cn';
import { SPRING, EASE, DUR, overlayFade } from '../lib/motion';
import { navFor, flatNav } from '../lib/nav';
import { Avatar } from '../ui/Avatar';
import { LogoBadge, MARCA } from '../ui/Logo';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { ChatSoporte } from './ChatSoporte';
import { IconLogout, IconX, IconMail, IconChevronsLeft } from '../ui/icons';

const SUBTITLE: Record<string, string> = {
  ADMIN: 'Administración',
  MEDICO: 'Portal médico',
  PATIENT: 'Portal del paciente',
};

// Aviso global cuando el usuario todavía no verificó su email
function VerificationBanner() {
  const user = useAuthStore(s => s.user);
  const reenviar = useReenviarVerificacion();
  if (!user || user.emailVerified) return null;

  const handle = async () => {
    try {
      const r = await reenviar.mutateAsync();
      toast.success(r.message);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo reenviar el email'));
    }
  };

  return (
    <div className="bg-warning-soft rounded-card ring-1 ring-inset ring-warning/20 px-4 sm:px-5 py-2.5 mb-5">
      <div className="flex items-center gap-3 text-[13px] text-warning-text">
        <IconMail className="w-4 h-4 shrink-0" />
        <p className="flex-1 font-medium">Verificá tu email para asegurar tu cuenta. Revisá tu casilla o reenviá el correo.</p>
        <button
          onClick={handle}
          disabled={reenviar.isPending}
          className="font-semibold underline underline-offset-2 hover:opacity-80 disabled:opacity-50 shrink-0"
        >
          {reenviar.isPending ? 'Enviando…' : 'Reenviar'}
        </button>
      </div>
    </div>
  );
}

interface SidebarProps {
  navId: string;
  expanded: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ navId, expanded, onToggle, onNavigate }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const groups = navFor(user?.role);
  // Los tooltips del rail colapsado se posicionan con `fixed` para que no los
  // recorte el scroll de la navegación.
  const [tip, setTip] = useState<{ top: number; label: string } | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showTip = (label: string) => (e: React.MouseEvent<HTMLElement>) => {
    if (expanded) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ top: r.top + r.height / 2, label });
  };
  const hideTip = () => setTip(null);

  return (
    <div className="flex flex-col h-full min-h-0 text-rail-fg">
      {/* Marca */}
      <div className={cn('flex items-center gap-3 px-4 pt-5 pb-4', !expanded && 'justify-center px-0')}>
        <button
          type="button"
          onClick={onToggle}
          disabled={!onToggle}
          aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}
          onMouseEnter={showTip('Expandir menú')}
          onMouseLeave={hideTip}
          className={cn('rounded-2xl transition-transform', onToggle && 'hover:scale-105 cursor-pointer')}
        >
          <LogoBadge size="sm" />
        </button>

        {expanded && (
          <div className="min-w-0 flex-1">
            <p className="text-rail-fg font-semibold text-sm tracking-tightish leading-tight">{MARCA}</p>
            <p className="text-xs text-rail-fg/60 leading-tight truncate">
              {SUBTITLE[user?.role ?? ''] ?? 'Portal del paciente'}
            </p>
          </div>
        )}

        {expanded && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Colapsar menú"
            className="grid place-items-center w-8 h-8 rounded-full bg-white/10 text-rail-fg/70 transition-colors hover:bg-white/20 hover:text-rail-fg"
          >
            <IconChevronsLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className={cn('flex-1 min-h-0 overflow-y-auto pb-2', expanded ? 'px-3' : 'px-4')}>
        {groups.map((group, gi) => (
          <div key={group.label}>
            {expanded ? (
              <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-rail-fg/45">
                {group.label}
              </p>
            ) : (
              gi > 0 && <div className="mx-auto my-3 h-px w-8 bg-white/10" aria-hidden="true" />
            )}

            <div className={expanded ? 'space-y-0.5' : 'space-y-2'}>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  onMouseEnter={showTip(item.label)}
                  onMouseLeave={hideTip}
                  className="block"
                >
                  {({ isActive }) => (
                    <span
                      className={cn(
                        'group relative flex items-center transition-colors duration-150',
                        expanded
                          ? 'gap-3 px-3 py-2.5 rounded-xl text-sm font-medium'
                          : 'w-12 h-12 mx-auto justify-center rounded-full',
                        isActive ? 'text-rail' : 'text-rail-fg/75 hover:text-rail-fg',
                      )}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId={navId}
                          transition={SPRING.snappy}
                          className={cn(
                            'absolute inset-0 bg-mint-grad shadow-glow-mint',
                            expanded ? 'rounded-xl' : 'rounded-full',
                          )}
                        />
                      ) : (
                        <span
                          className={cn(
                            'absolute inset-0 bg-white/[0.06] transition-colors group-hover:bg-white/[0.14]',
                            expanded ? 'rounded-xl' : 'rounded-full',
                          )}
                        />
                      )}

                      <item.icon className="relative w-[18px] h-[18px]" />
                      {expanded && <span className="relative truncate">{item.label}</span>}
                      {isActive && expanded && (
                        <span className="active-indicator relative ml-auto w-1.5 h-1.5 rounded-full bg-rail/70" />
                      )}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className={cn('pt-3 pb-4 border-t border-white/10', expanded ? 'px-3' : 'px-4')}>
        <div className={cn('flex items-center gap-3 mb-2', expanded ? 'px-2' : 'justify-center')}>
          <button
            type="button"
            onClick={onToggle}
            disabled={!onToggle}
            aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}
            onMouseEnter={showTip(`${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() || 'Mi cuenta')}
            onMouseLeave={hideTip}
            className={cn('rounded-full transition-transform', onToggle && 'hover:scale-105 cursor-pointer')}
          >
            <Avatar nombre={user?.nombre} apellido={user?.apellido} size="sm" />
          </button>
          {expanded && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-rail-fg truncate leading-tight">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-xs text-rail-fg/60 truncate leading-tight">{user?.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          onMouseEnter={showTip('Cerrar sesión')}
          onMouseLeave={hideTip}
          aria-label="Cerrar sesión"
          className={cn(
            'flex items-center text-sm font-medium text-rail-fg/75 transition-colors duration-150 hover:bg-danger/25 hover:text-white',
            expanded
              ? 'w-full gap-3 px-3 py-2.5 rounded-xl'
              : 'w-12 h-12 mx-auto justify-center rounded-full bg-white/[0.06]',
          )}
        >
          <IconLogout className="w-[18px] h-[18px] opacity-80" />
          {expanded && 'Cerrar sesión'}
        </button>
      </div>

      {/* Tooltip del rail colapsado */}
      <AnimatePresence>
        {!expanded && tip && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: DUR.fast }}
            style={{ top: tip.top, left: 'calc(1.5rem + 5rem + 0.75rem)' }}
            className="fixed z-50 -translate-y-1/2 pointer-events-none whitespace-nowrap rounded-xl bg-rail-soft px-3 py-1.5 text-[13px] font-medium text-rail-fg shadow-pop ring-1 ring-inset ring-white/10"
          >
            {tip.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const expanded = useSidebarStore(s => s.expanded);
  const toggleRail = useSidebarStore(s => s.toggle);

  const items = flatNav(navFor(user?.role));
  const pageTitle =
    [...items].sort((a, b) => b.to.length - a.to.length)
      .find(item => location.pathname.startsWith(item.to))?.label ?? MARCA;

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Rail desktop — flotante y colapsable */}
      <aside className="hidden lg:block shrink-0 py-6 pl-6">
        <div
          className={cn(
            'flex flex-col h-full rounded-rail gradient-sidebar shadow-rail ring-1 ring-inset ring-white/10',
            'transition-[width] duration-300 ease-in-out',
            expanded ? 'w-64' : 'w-20',
          )}
        >
          <SidebarContent navId="rail-active" expanded={expanded} onToggle={toggleRail} />
        </div>
      </aside>

      {/* Drawer mobile */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              variants={overlayFade}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 bg-scrim/60 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0, transition: { duration: DUR.slow, ease: EASE.outExpo } }}
              exit={{ x: '-100%', transition: { duration: DUR.base, ease: EASE.in } }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] gradient-sidebar shadow-modal flex flex-col"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
                className="absolute top-5 right-4 z-10 p-1.5 rounded-full bg-white/10 text-rail-fg/70 hover:text-rail-fg hover:bg-white/20 transition-colors"
              >
                <IconX />
              </button>
              <SidebarContent navId="drawer-active" expanded onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={pageTitle} onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-5 pt-2 sm:p-8 sm:pt-3 xl:px-10">
            <VerificationBanner />
            {children}
          </div>
        </main>
      </div>

      <CommandPalette />
      {user?.role === 'PATIENT' && <ChatSoporte />}
    </div>
  );
}
