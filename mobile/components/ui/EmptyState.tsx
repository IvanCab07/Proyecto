import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function EmptyState({
  icon, title, message, action, className,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('items-center justify-center px-8 py-12', className)}>
      {icon ? (
        <View className="w-16 h-16 rounded-2xl bg-brand-50 items-center justify-center mb-4">{icon}</View>
      ) : null}
      <Text className="text-base font-bold text-slate-900 text-center">{title}</Text>
      {message ? <Text className="text-sm text-slate-500 text-center mt-1.5 leading-5">{message}</Text> : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}
