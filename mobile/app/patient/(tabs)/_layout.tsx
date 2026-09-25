import { View } from 'react-native';
import { MaterialTopTabs } from '../../../components/MaterialTopTabs';
import { RoleTabBar, type TabDef } from '../../../components/RoleTabBar';
import { ChatSoporte } from '../../../components/ChatSoporte';
import { IconHome, IconCalendar, IconPlus, IconPill, IconList } from '../../../components/ui';

// Lo del día a día en la barra; el resto (perfil, estudios, mapa, servidor) en Menú.
const TABS: TabDef[] = [
  { name: 'inicio',    Icon: IconHome,     label: 'Inicio' },
  { name: 'turnos',    Icon: IconCalendar, label: 'Turnos' },
  { name: 'solicitar', Icon: IconPlus,     label: 'Solicitar turno', isFab: true },
  { name: 'recetas',   Icon: IconPill,     label: 'Recetas' },
  { name: 'menu',      Icon: IconList,     label: 'Menú' },
];

export default function PatientTabsLayout() {
  return (
    <View className="flex-1">
      <MaterialTopTabs
        tabBar={(props) => <RoleTabBar {...props} tabs={TABS} />}
        tabBarPosition="bottom"
        screenOptions={{ swipeEnabled: true }}
      >
        {TABS.map((t) => <MaterialTopTabs.Screen key={t.name} name={t.name} />)}
      </MaterialTopTabs>
      <ChatSoporte />
    </View>
  );
}
