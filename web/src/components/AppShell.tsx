import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { useReenviarVerificacion } from '../hooks';
import { apiError } from '../lib/apiError';
import { cn } from '../lib/cn';
import { SPRING, EASE, DUR, overlayFade } from '../lib/motion';
import { navFor, flatNav } from '../lib/nav';
import { Avatar } from '../ui/Avatar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { ChatSoporte } from './ChatSoporte';
import { IconLogout, IconX, IconMail } from '../ui/icons';

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
    <div className="bg-warning-soft border-b border-warning/20 px-5 sm:px-8 xl:px-10 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-[13px] text-warning-text">
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

function Monogram({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white grid place-items-center font-bold text-lg leading-none select-none shrink-0 shadow-glow-brand',
        className,
      )}
      aria-hidden="true"
    >
      H<span className="text-brand-100 text-sm">+</span>
    </div>
  );
}

function SidebarContent({ navId, onNavigate }: { navId: string; onNavigate?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const groups = navFor(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5">
        <Monogram />
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm tracking-tightish leading-tight">Hospital</p>
          <p className="text-xs text-slate-400 leading-tight">
            {user?.role === 'ADMIN' ? 'Administración' : 'Portal del paciente'}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {groups.map(group => (
          <div key={group.label}>
            <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} onClick={onNavigate} className="block">
                  {({ isActive }) => (
                    <span
                      className={cn(
                        'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                        isActive ? 'text-white' : 'text-slate-300 hover:text-white',
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId={navId}
                          transition={SPRING.snappy}
                          className="absolute inset-0 rounded-lg bg-brand-500/15 ring-1 ring-inset ring-brand-400/25"
                        />
                      )}
                      <item.icon
                        className={cn(
                          'relative w-[18px] h-[18px] transition-colors',
                          isActive ? 'text-brand-300' : 'text-slate-400 group-hover:text-slate-200',
                        )}
                      />
                      <span className="relative">{item.label}</span>
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-2">
          <Avatar nombre={user?.nombre} apellido={user?.apellido} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-xs text-slate-400 truncate leading-tight">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-danger/15 hover:text-red-300"
        >
          <IconLogout className="w-[18px] h-[18px] opacity-80" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = flatNav(navFor(user?.role));
  const pageTitle =
    [...items].sort((a, b) => b.to.length - a.to.length)
      .find(item => location.pathname.startsWith(item.to))?.label ?? 'Hospital';

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Rail desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-rail bg-rail-grad">
        <SidebarContent navId="rail-active" />
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
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0, transition: { duration: DUR.slow, ease: EASE.outExpo } }}
              exit={{ x: '-100%', transition: { duration: DUR.base, ease: EASE.in } }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-rail bg-rail-grad shadow-modal flex flex-col"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <IconX />
              </button>
              <SidebarContent navId="drawer-active" onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={pageTitle} onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <VerificationBanner />
          <div className="max-w-7xl mx-auto p-5 sm:p-8 xl:px-10">{children}</div>
        </main>
      </div>

      <CommandPalette />
      {user?.role === 'PATIENT' && <ChatSoporte />}
    </div>
  );
}
