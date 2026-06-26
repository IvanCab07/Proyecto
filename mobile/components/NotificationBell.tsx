import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useUnreadCount } from '../hooks';
import { IconBell } from './ui';

// Campana con badge para los headers de las pantallas principales.
// Va sobre el gradiente oscuro del ScreenHeader, por eso el ícono es blanco.
export function NotificationBell({ color = '#fff' }: { color?: string }) {
  const router = useRouter();
  const { data: unread = 0 } = useUnreadCount();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={10}
      accessibilityLabel={unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
      className="w-10 h-10 rounded-full items-center justify-center bg-white/10"
    >
      <IconBell size={20} color={color} />
      {unread > 0 && (
        <View className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-500 items-center justify-center">
          <Text className="text-white text-[10px] font-bold">{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}
