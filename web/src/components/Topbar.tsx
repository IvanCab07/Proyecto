import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCommandStore } from '../store/useCommandStore';
import { Avatar } from '../ui/Avatar';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { NotificationsBell } from './NotificationsPanel';
import { IconMenu, IconSearch, IconUser, IconSettings, IconLogout } from '../ui/icons';

export function Topbar({ title, onOpenDrawer }: { title: string; onOpenDrawer: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const openCommand = useCommandStore(s => s.setOpen);
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => { logout(); navigate('/login'); };

  const userItems: MenuItem[] = [
    isAdmin
      ? { label: 'Ajustes', icon: <IconSettings />, onSelect: () => navigate('/admin/ajustes') }
      : { label: 'Mi perfil', icon: <IconUser />, onSelect: () => navigate('/paciente/perfil') },
    { label: 'Cerrar sesión', icon: <IconLogout />, tone: 'danger', onSelect: handleLogout },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-16 shrink-0 bg-canvas/85 backdrop-blur border-b border-slate-200/80">
      <button
        onClick={onOpenDrawer}
        aria-label="Abrir menú"
        className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <IconMenu className="w-5 h-5" />
      </button>

      <h1 className="font-bold text-slate-900 tracking-tightish text-[17px] flex-1 truncate">{title}</h1>

      <button
        onClick={() => openCommand(true)}
        className="hidden md:flex items-center gap-2 h-9 pl-3 pr-2 rounded-field bg-surface ring-1 ring-inset ring-slate-200 text-slate-400 hover:ring-slate-300 hover:text-slate-500 transition-colors"
      >
        <IconSearch className="w-4 h-4" />
        <span className="text-sm pr-10">Buscar…</span>
        <kbd className="inline-flex items-center h-5 px-1.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">⌘K</kbd>
      </button>
      <button
        onClick={() => openCommand(true)}
        aria-label="Buscar"
        className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <IconSearch className="w-5 h-5" />
      </button>

      <NotificationsBell />

      <div className="flex items-center gap-2 pl-1">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-[13px] font-semibold text-slate-800">{user?.nombre} {user?.apellido}</span>
          <span className="text-xs text-slate-400">{isAdmin ? 'Administrador' : 'Paciente'}</span>
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
