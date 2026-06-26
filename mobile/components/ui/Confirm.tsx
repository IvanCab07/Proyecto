import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { PressableScale } from '../../lib/motion';
import { haptic } from '../../lib/haptics';
import { colors } from '../../lib/theme';

// Confirmaciones y menús de acción con el diseño de la app (reemplazan Alert.alert).
// Se exponen como funciones tipo Alert.alert para que migrar sea un cambio mínimo:
//   const ok = await confirm({ title, message, destructive });
//   actionSheet({ title, options: [{ label, onPress }] });

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export type ActionOption = { label: string; onPress?: () => void; destructive?: boolean };
export type ActionOptions = { title: string; message?: string; options: ActionOption[] };

let _confirm: ((o: ConfirmOptions) => Promise<boolean>) | null = null;
let _action: ((o: ActionOptions) => void) | null = null;

// API imperativa (se puede llamar desde cualquier handler, igual que Alert.alert)
export function confirm(o: ConfirmOptions): Promise<boolean> {
  return _confirm ? _confirm(o) : Promise.resolve(false);
}
export function actionSheet(o: ActionOptions): void {
  _action?.(o);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);
  const [actionOpts, setActionOpts] = useState<ActionOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const runConfirm = useCallback((o: ConfirmOptions) => {
    haptic.warning();
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setConfirmOpts(o);
    });
  }, []);

  const runAction = useCallback((o: ActionOptions) => {
    haptic.light();
    setActionOpts(o);
  }, []);

  _confirm = runConfirm;
  _action = runAction;

  const finishConfirm = (val: boolean) => {
    setConfirmOpts(null);
    resolver.current?.(val);
    resolver.current = null;
  };

  return (
    <>
      {children}

      <Sheet visible={!!confirmOpts} onClose={() => finishConfirm(false)} title={confirmOpts?.title}>
        {confirmOpts?.message ? (
          <Text className="text-[15px] text-slate-500 leading-6 mb-5">{confirmOpts.message}</Text>
        ) : (
          <View className="mb-3" />
        )}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="secondary" fullWidth onPress={() => finishConfirm(false)}>
              {confirmOpts?.cancelText ?? 'Cancelar'}
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant={confirmOpts?.destructive ? 'danger' : 'primary'}
              fullWidth
              onPress={() => finishConfirm(true)}
            >
              {confirmOpts?.confirmText ?? 'Confirmar'}
            </Button>
          </View>
        </View>
      </Sheet>

      <Sheet visible={!!actionOpts} onClose={() => setActionOpts(null)} title={actionOpts?.title}>
        {actionOpts?.message ? (
          <Text className="text-[14px] text-slate-500 leading-6 mb-3">{actionOpts.message}</Text>
        ) : null}
        <View className="gap-2.5">
          {actionOpts?.options.map((opt) => (
            <PressableScale
              key={opt.label}
              haptic="select"
              onPress={() => {
                setActionOpts(null);
                opt.onPress?.();
              }}
              className="flex-row items-center justify-center rounded-field h-[52px] bg-slate-100"
            >
              <Text
                className="text-[15px] font-semibold"
                style={{ color: opt.destructive ? colors.danger.text : colors.slate[800] }}
              >
                {opt.label}
              </Text>
            </PressableScale>
          ))}
          <PressableScale
            haptic="select"
            onPress={() => setActionOpts(null)}
            className="flex-row items-center justify-center rounded-field h-[52px]"
          >
            <Text className="text-[15px] font-semibold text-slate-400">Cancelar</Text>
          </PressableScale>
        </View>
      </Sheet>
    </>
  );
}
