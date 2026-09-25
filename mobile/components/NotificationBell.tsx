import { useRouter } from 'expo-router';
import { useUnreadCount } from '../hooks';
import { IconBell, TopbarButton } from './ui';
import { useTheme } from '../lib/useTheme';

// Campana con badge para las barras de las pantallas principales.
//
// Usa TopbarButton, así comparte caja con el selector de tema y con cualquier acción que se
// sume después. `onDark` es para las pocas cabeceras que siguen sobre verde.
export function NotificationBell({ onDark = false }: { onDark?: boolean }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: unread = 0 } = useUnreadCount();

  return (
    <TopbarButton onPress={() => router.push('/notifications')} badge={unread} onDark={onDark}>
      <IconBell size={19} color={onDark ? colors.railFg : colors.slate[600]} />
    </TopbarButton>
  );
}
