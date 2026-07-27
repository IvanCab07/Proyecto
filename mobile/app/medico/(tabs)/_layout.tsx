import { MaterialTopTabs } from '../../../components/MaterialTopTabs';
import { RoleTabBar, type TabDef } from '../../../components/RoleTabBar';
import { IconHome, IconCalendar, IconUsers, IconPill, IconList } from '../../../components/ui';

// La atención del día en la barra; perfil y calificaciones en Menú.
const TABS: TabDef[] = [
  { name: 'inicio',    Icon: IconHome,     label: 'Inicio' },
  { name: 'agenda',    Icon: IconCalendar, label: 'Agenda' },
  { name: 'pacientes', Icon: IconUsers,    label: 'Pacientes' },
  { name: 'recetas',   Icon: IconPill,     label: 'Recetas' },
  { name: 'menu',      Icon: IconList,     label: 'Menú' },
];

export default function MedicoTabsLayout() {
  return (
    <MaterialTopTabs
      tabBar={(props) => <RoleTabBar {...props} tabs={TABS} />}
      tabBarPosition="bottom"
      screenOptions={{ swipeEnabled: true }}
    >
      {TABS.map((t) => <MaterialTopTabs.Screen key={t.name} name={t.name} />)}
    </MaterialTopTabs>
  );
}
