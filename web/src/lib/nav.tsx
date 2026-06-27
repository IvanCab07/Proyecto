import type { ComponentType } from 'react';
import {
  IconGrid, IconCalendar, IconCalendarDays, IconUsers, IconStethoscope, IconTag,
  IconChart, IconSettings, IconHome, IconPlus, IconPill, IconFolder, IconUser, IconShield, IconMapPin, IconSparkle,
} from '../ui/icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const adminNav: NavGroup[] = [
  {
    label: 'Panel',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: IconGrid },
    ],
  },
  {
    label: 'Cuentas',
    items: [
      { to: '/admin/usuarios',       label: 'Usuarios',       icon: IconShield },
      { to: '/admin/medicos',        label: 'Médicos',        icon: IconStethoscope },
      { to: '/admin/especialidades', label: 'Especialidades', icon: IconTag },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/admin/calificaciones', label: 'Calificaciones', icon: IconSparkle },
      { to: '/admin/reportes',       label: 'Reportes',       icon: IconChart },
      { to: '/admin/ajustes',        label: 'Ajustes',        icon: IconSettings },
    ],
  },
];

export const pacienteNav: NavGroup[] = [
  {
    label: 'Mi salud',
    items: [
      { to: '/paciente/inicio',    label: 'Inicio',          icon: IconHome },
      { to: '/paciente/turnos',    label: 'Mis turnos',      icon: IconCalendar },
      { to: '/paciente/solicitar', label: 'Solicitar turno', icon: IconPlus },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { to: '/paciente/recetas',  label: 'Recetas',  icon: IconPill },
      { to: '/paciente/estudios', label: 'Estudios', icon: IconFolder },
    ],
  },
  {
    label: 'Centros',
    items: [
      { to: '/paciente/mapa', label: 'Centros y mapa', icon: IconMapPin },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { to: '/paciente/perfil', label: 'Perfil', icon: IconUser },
    ],
  },
];

export const medicoNav: NavGroup[] = [
  {
    label: 'Atención',
    items: [
      { to: '/medico/inicio',         label: 'Inicio',        icon: IconHome },
      { to: '/medico/agenda',         label: 'Mi agenda',     icon: IconCalendarDays },
      { to: '/medico/pacientes',      label: 'Mis pacientes', icon: IconUsers },
      { to: '/medico/recetas',        label: 'Recetas',       icon: IconPill },
      { to: '/medico/calificaciones', label: 'Calificaciones', icon: IconSparkle },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { to: '/medico/perfil', label: 'Perfil', icon: IconUser },
    ],
  },
];

export const navFor = (role?: string): NavGroup[] =>
  role === 'ADMIN' ? adminNav : role === 'MEDICO' ? medicoNav : pacienteNav;

// Ruta de inicio según el rol (se usa al loguearse y en las redirecciones)
export const homePath = (role?: string): string =>
  role === 'ADMIN' ? '/admin/dashboard' : role === 'MEDICO' ? '/medico/inicio' : '/paciente/inicio';

export const flatNav = (groups: NavGroup[]): NavItem[] =>
  groups.flatMap(g => g.items);
