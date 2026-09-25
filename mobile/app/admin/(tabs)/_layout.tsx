import { MaterialTopTabs } from '../../../components/MaterialTopTabs';
import { RoleTabBar, type TabDef } from '../../../components/RoleTabBar';
import { IconGrid, IconShield, IconStethoscope, IconChart, IconList } from '../../../components/ui';

// Usuarios sube a la barra: es la gestión más frecuente del admin y antes estaba dos niveles
// adentro de Ajustes. Especialidades, Calificaciones, Reportes y Ajustes viven en Menú.
const TABS: TabDef[] = [
  { name: 'dashboard', Icon: IconGrid,        label: 'Panel' },
  { name: 'usuarios',  Icon: IconShield,      label: 'Usuarios' },
  { name: 'medicos',   Icon: IconStethoscope, label: 'Médicos' },
  { name: 'reportes',  Icon: IconChart,       label: 'Reportes' },
  { name: 'menu',      Icon: IconList,        label: 'Menú' },
];

export default function AdminTabsLayout() {
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
