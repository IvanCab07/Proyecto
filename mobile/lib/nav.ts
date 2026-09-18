import type { ComponentType } from 'react';
import {
  IconGrid, IconCalendar, IconUsers, IconStethoscope, IconTag, IconChart, IconSettings,
  IconHome, IconPlus, IconPill, IconFolder, IconUser, IconShield, IconMapPin, IconStar,
} from '../components/ui';
import type { IconProps } from '../components/ui/Icon';

// Mapa de secciones por rol: espeja web/src/lib/nav.tsx (mismos grupos, mismas etiquetas,
// mismo orden) con las rutas de expo-router.
//
// Es la fuente única de verdad de la navegación: de acá salen las pestañas, la pantalla
// «Menú» de cada rol y los accesos rápidos de cada inicio. Antes cada pantalla tenía su
// propia lista escrita a mano y se desincronizaban entre sí y con la web.

export interface NavItem {
  to: string;
  label: string;
  /** Bajada de una línea; solo la usa la pantalla «Menú». */
  desc?: string;
  icon: ComponentType<IconProps>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const adminNav: NavGroup[] = [
  {
    label: 'Panel',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', desc: 'Turnos de toda la clínica', icon: IconGrid },
    ],
  },
  {
    label: 'Cuentas',
    items: [
      { to: '/admin/usuarios',       label: 'Usuarios',       desc: 'Crear, editar y dar de baja', icon: IconShield },
      { to: '/admin/medicos',        label: 'Médicos',        desc: 'Plantel y disponibilidad',    icon: IconStethoscope },
      { to: '/admin/especialidades', label: 'Especialidades', desc: 'Catálogo médico',             icon: IconTag },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/admin/calificaciones', label: 'Calificaciones', desc: 'Reseñas y promedio por médico', icon: IconStar },
      { to: '/admin/reportes',       label: 'Reportes',       desc: 'Métricas y actividad',          icon: IconChart },
      { to: '/admin/ajustes',        label: 'Ajustes',        desc: 'Tu cuenta y seguridad',         icon: IconSettings },
    ],
  },
];

export const medicoNav: NavGroup[] = [
  {
    label: 'Atención',
    items: [
      { to: '/medico/inicio',         label: 'Inicio',         desc: 'Resumen del día',       icon: IconHome },
      { to: '/medico/agenda',         label: 'Mi agenda',      desc: 'Turnos asignados',      icon: IconCalendar },
      { to: '/medico/pacientes',      label: 'Mis pacientes',  desc: 'Historial por persona', icon: IconUsers },
      { to: '/medico/recetas',        label: 'Recetas',        desc: 'Emitidas y nuevas',     icon: IconPill },
      { to: '/medico/calificaciones', label: 'Calificaciones', desc: 'Lo que opinan de vos',  icon: IconStar },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { to: '/medico/perfil', label: 'Perfil',   desc: 'Tus datos y seguridad',   icon: IconUser },
    ],
  },
];

export const pacienteNav: NavGroup[] = [
  {
    label: 'Mi salud',
    items: [
      { to: '/patient/inicio',    label: 'Inicio',          desc: 'Tu resumen',            icon: IconHome },
      { to: '/patient/turnos',    label: 'Mis turnos',      desc: 'Próximos e historial',  icon: IconCalendar },
      { to: '/patient/solicitar', label: 'Solicitar turno', desc: 'Reservá con un médico', icon: IconPlus },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { to: '/patient/recetas',  label: 'Recetas',  desc: 'Tus indicaciones', icon: IconPill },
      { to: '/patient/estudios', label: 'Estudios', desc: 'Subí y consultá',  icon: IconFolder },
    ],
  },
  {
    label: 'Centros',
    items: [
      { to: '/patient/mapa', label: 'Centros y mapa', desc: 'Cómo llegar y emergencias', icon: IconMapPin },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { to: '/patient/perfil', label: 'Perfil',   desc: 'Tus datos y seguridad',   icon: IconUser },
    ],
  },
];

export const navFor = (role?: string): NavGroup[] =>
  role === 'ADMIN' ? adminNav : role === 'MEDICO' ? medicoNav : pacienteNav;

/**
 * Pantalla de datos de la cuenta. En admin se llama "Ajustes" y vive en el grupo Sistema, no en
 * uno de Cuenta, así que no se puede deducir por posición.
 */
export const perfilPath = (role?: string): string =>
  role === 'ADMIN' ? '/admin/ajustes' : role === 'MEDICO' ? '/medico/perfil' : '/patient/perfil';

// Ruta de inicio según el rol. La usan el login, el 2do paso de 2FA, el registro y el gate de
// arranque: antes cada uno tenía su propio if y no coincidían (a MEDICO lo mandaban a /inicio
// desde el login y a /agenda desde el arranque).
export const homePath = (role?: string): string =>
  role === 'ADMIN' ? '/admin/dashboard' : role === 'MEDICO' ? '/medico/inicio' : '/patient/inicio';

export const flatNav = (groups: NavGroup[]): NavItem[] => groups.flatMap((g) => g.items);

/**
 * Los accesos rápidos de cada inicio: las secciones de trabajo del rol.
 *
 * Quedan afuera la home (ya estás ahí) y el perfil: es cosa de cuenta, no una tarea, y se
 * llega desde la pestaña Menú.
 */
export const accesosFor = (role?: string): NavItem[] => {
  const excluir = new Set([homePath(role), perfilPath(role)]);
  return flatNav(navFor(role)).filter((i) => !excluir.has(i.to));
};
