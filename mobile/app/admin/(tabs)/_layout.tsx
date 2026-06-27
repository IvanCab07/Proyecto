import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { MaterialTopTabs } from '../../../components/MaterialTopTabs';
import { PressableScale } from '../../../lib/motion';
import { cn } from '../../../lib/cn';
import { colors, shadow } from '../../../lib/theme';
import { IconGrid, IconStethoscope, IconChart, IconSettings } from '../../../components/ui';

const TABS = [
  { name: 'dashboard', Icon: IconGrid,        label: 'Panel' },
  { name: 'medicos',   Icon: IconStethoscope, label: 'Médicos' },
  { name: 'reportes',  Icon: IconChart,       label: 'Reportes' },
  { name: 'ajustes',   Icon: IconSettings,    label: 'Ajustes' },
];

function AdminTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 6), paddingTop: 8, paddingHorizontal: 16 }}>
      <View className="flex-row items-center bg-surface rounded-[26px] px-2 py-2" style={shadow.pop}>
        {TABS.map((tab) => {
          const focused = focusedName === tab.name;
          const go = () => { if (focusedName !== tab.name) navigation.navigate(tab.name as never); };
          return (
            <View key={tab.name} className="flex-1">
              <PressableScale haptic="select" onPress={go} scaleTo={0.9} className="items-center py-1.5">
                <tab.Icon size={20} color={focused ? colors.brand[600] : colors.slate[400]} />
                <Text className={cn('text-[10px] font-bold mt-1', focused ? 'text-brand-700' : 'text-slate-400')}>
                  {tab.label}
                </Text>
              </PressableScale>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminTabsLayout() {
  return (
    <MaterialTopTabs
      tabBar={(props) => <AdminTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{ swipeEnabled: true }}
    >
      <MaterialTopTabs.Screen name="dashboard" />
      <MaterialTopTabs.Screen name="medicos" />
      <MaterialTopTabs.Screen name="reportes" />
      <MaterialTopTabs.Screen name="ajustes" />
    </MaterialTopTabs>
  );
}
