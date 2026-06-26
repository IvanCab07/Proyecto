import * as Haptics from 'expo-haptics';

// Feedback táctil afinado: selección (tabs/segmentos), impacto (botones), notificación (resultado).
// Envuelto en catch para no romper en dispositivos/simuladores sin soporte.
export const haptic = {
  select:  () => { Haptics.selectionAsync().catch(() => {}); },
  light:   () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); },
  medium:  () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); },
  success: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); },
  warning: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); },
  error:   () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); },
};

export type HapticKind = keyof typeof haptic | false;
