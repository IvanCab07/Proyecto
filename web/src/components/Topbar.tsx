import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCommandStore } from '../store/useCommandStore';
import { useThemeStore } from '../store/useThemeStore';
import { Avatar } from '../ui/Avatar';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { NotificationsBell } from './NotificationsPanel';
import { IconMenu, IconSearch, IconUser, IconSettings, IconLogout, IconSun, IconMoon } from '../ui/icons';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  MEDICO: 'Médico',
  PATIENT: 'Paciente',
};

export function Topbar({ title, onOpenDrawer }: { title: string; onOpenDrawer: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const openCommand = useCommandStore(s => s.setOpen);
  const theme = useThemeStore(s => s.theme);
  const toggleTheme = useThemeStore(s => s.toggle);
  const isAdmin = user?.role === 'ADMIN';
  const isDark = theme === 'dark';

  const handleLogout = () => { logout(); navigate('/login'); };

  const perfilPath = user?.role === 'MEDICO' ? '/medico/perfil' : '/paciente/perfil';

  const userItems: MenuItem[] = [
    isAdmin
      ? { label: 'Ajustes', icon: <IconSettings />, onSelect: () => navigate('/admin/ajustes') }
      : { label: 'Mi perfil', icon: <IconUser />, onSelect: () => navigate(perfilPath) },
    { label: 'Cerrar sesión', icon: <IconLogout />, tone: 'danger', onSelect: handleLogout },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 h-16 shrink-0 bg-canvas/80 backdrop-blur-md">
      <button
        onClick={onOpenDrawer}
        aria-label="Abrir menú"
        className="lg:hidden p-2 -ml-2 rounded-field text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <IconMenu className="w-5 h-5" />
      </button>

      <h1 className="font-semibold text-slate-900 tracking-tightish text-[17px] flex-1 truncate">{title}</h1>

      <button
        onClick={() => openCommand(true)}
        className="hidden md:flex items-center gap-2 h-10 pl-3.5 pr-2 rounded-pill bg-surface ring-1 ring-inset ring-slate-200 text-slate-400 shadow-xs hover:ring-brand-300 hover:text-slate-500 transition-colors"
      >
        <IconSearch className="w-4 h-4" />
        <span className="text-sm pr-10">Buscar…</span>
        <kbd className="inline-flex items-center h-5 px-1.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">⌘K</kbd>
      </button>
      <button
        onClick={() => openCommand(true)}
        aria-label="Buscar"
        className="md:hidden p-2 rounded-field text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <IconSearch className="w-5 h-5" />
      </button>

      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        title={isDark ? 'Tema claro' : 'Tema oscuro'}
        className="grid place-items-center w-10 h-10 rounded-full bg-surface ring-1 ring-inset ring-slate-200 text-slate-500 shadow-xs transition-colors hover:text-brand-600 hover:ring-brand-300"
      >
        {isDark ? <IconSun className="w-[18px] h-[18px]" /> : <IconMoon className="w-[18px] h-[18px]" />}
      </button>

      <NotificationsBell />

      <div className="flex items-center gap-2 pl-1">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-[13px] font-semibold text-slate-800">{user?.nombre} {user?.apellido}</span>
          <span className="text-xs text-slate-400">{ROLE_LABEL[user?.role ?? ''] ?? 'Paciente'}</span>
        </div>
        <Menu
          trigger={<Avatar nombre={user?.nombre} apellido={user?.apellido} size="sm" />}
          items={userItems}
          triggerLabel="Menú de usuario"
        />
      </div>
    </header>
  );
}
