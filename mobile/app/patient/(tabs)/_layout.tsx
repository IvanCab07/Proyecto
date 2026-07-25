import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { MaterialTopTabs } from '../../../components/MaterialTopTabs';
import { PressableScale } from '../../../lib/motion';
import { cn } from '../../../lib/cn';
import { colors, shadow } from '../../../lib/theme';
import { IconHome, IconCalendar, IconPlus, IconPill, IconUser } from '../../../components/ui';
import { ChatSoporte } from '../../../components/ChatSoporte';

const TABS = [
  { name: 'inicio',    Icon: IconHome,     label: 'Inicio' },
  { name: 'turnos',    Icon: IconCalendar, label: 'Turnos' },
  { name: 'solicitar', Icon: IconPlus,     label: '', isFab: true },
  { name: 'recetas',   Icon: IconPill,     label: 'Recetas' },
  { name: 'perfil',    Icon: IconUser,     label: 'Perfil' },
];

function PatientTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 6), paddingTop: 8, paddingHorizontal: 16 }}>
      <View className="flex-row items-center bg-surface rounded-[26px] px-2 py-2" style={shadow.pop}>
        {TABS.map((tab) => {
          const focused = focusedName === tab.name;
          const go = () => { if (focusedName !== tab.name) navigation.navigate(tab.name as never); };

          if (tab.isFab) {
            return (
              <View key={tab.name} className="flex-1 items-center" style={{ marginTop: -28 }}>
                <PressableScale haptic="medium" onPress={go}>
                  <LinearGradient
                    colors={[colors.brand[400], colors.brand[600]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[{ width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' }, shadow.glowBrand]}
                  >
                    <IconPlus size={24} color="#fff" />
                  </LinearGradient>
                </PressableScale>
              </View>
            );
          }

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

export default function PatientTabsLayout() {
  return (
    <View className="flex-1">
      <MaterialTopTabs
        tabBar={(props) => <PatientTabBar {...props} />}
        tabBarPosition="bottom"
        screenOptions={{ swipeEnabled: true }}
      >
        <MaterialTopTabs.Screen name="inicio" />
        <MaterialTopTabs.Screen name="turnos" />
        <MaterialTopTabs.Screen name="solicitar" />
        <MaterialTopTabs.Screen name="recetas" />
        <MaterialTopTabs.Screen name="perfil" />
      </MaterialTopTabs>
      <ChatSoporte />
    </View>
  );
}
