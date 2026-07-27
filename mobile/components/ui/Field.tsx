import { forwardRef, useState } from 'react';
import type { ReactNode } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { TextInputProps } from 'react-native';
import { cn } from '../../lib/cn';
import type { Palette } from '../../lib/theme';
import { useTheme } from '../../lib/useTheme';
import { IconEye, IconEyeOff } from './Icon';

function borderStyle(colors: Palette, focused: boolean, error?: string) {
  return {
    borderWidth: 1.5,
    borderColor: error ? colors.danger.DEFAULT : focused ? colors.brand[600] : colors.slate[200],
  };
}

export function Field({
  label, hint, error, required, className, children,
}: {
  label?: string; hint?: string; error?: string; required?: boolean; className?: string; children: ReactNode;
}) {
  return (
    <View className={cn('w-full', className)}>
      {label ? (
        <Text className="text-[13px] font-semibold text-slate-700 mb-1.5">
          {label}{required ? <Text className="text-danger"> *</Text> : null}
        </Text>
      ) : null}
      {children}
      {error ? (
        <Text className="text-[13px] font-medium text-danger mt-1.5">{error}</Text>
      ) : hint ? (
        <Text className="text-[13px] text-slate-400 mt-1.5">{hint}</Text>
      ) : null}
    </View>
  );
}

type InputProps = TextInputProps & {
  label?: string; hint?: string; error?: string; required?: boolean; className?: string; iconLeft?: ReactNode;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, required, className, iconLeft, onFocus, onBlur, ...rest }, ref,
) {
  const { colors } = useTheme();
  const [f, setF] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      <View className="flex-row items-center bg-surface rounded-field px-3.5" style={borderStyle(colors, f, error)}>
        {iconLeft ? <View className="mr-2.5">{iconLeft}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.slate[400]}
          className="flex-1 text-[15px] text-slate-900 py-3"
          onFocus={(e) => { setF(true); onFocus?.(e); }}
          onBlur={(e) => { setF(false); onBlur?.(e); }}
          {...rest}
        />
      </View>
    </Field>
  );
});

export const PasswordInput = forwardRef<TextInput, InputProps>(function PasswordInput(
  { label, hint, error, required, className, iconLeft, onFocus, onBlur, ...rest }, ref,
) {
  const { colors } = useTheme();
  const [f, setF] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      <View className="flex-row items-center bg-surface rounded-field px-3.5" style={borderStyle(colors, f, error)}>
        {iconLeft ? <View className="mr-2.5">{iconLeft}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.slate[400]}
          secureTextEntry={!show}
          className="flex-1 text-[15px] text-slate-900 py-3"
          onFocus={(e) => { setF(true); onFocus?.(e); }}
          onBlur={(e) => { setF(false); onBlur?.(e); }}
          {...rest}
        />
        <Pressable onPress={() => setShow(v => !v)} hitSlop={10} className="pl-2">
          {show ? <IconEyeOff size={18} color={colors.slate[400]} /> : <IconEye size={18} color={colors.slate[400]} />}
        </Pressable>
      </View>
    </Field>
  );
});

export const Textarea = forwardRef<TextInput, InputProps>(function Textarea(
  { label, hint, error, required, className, onFocus, onBlur, style, ...rest }, ref,
) {
  const { colors } = useTheme();
  const [f, setF] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      <View className="bg-surface rounded-field px-3.5 py-3" style={borderStyle(colors, f, error)}>
        <TextInput
          ref={ref}
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.slate[400]}
          className="text-[15px] text-slate-900"
          style={[{ minHeight: 92 }, style]}
          onFocus={(e) => { setF(true); onFocus?.(e); }}
          onBlur={(e) => { setF(false); onBlur?.(e); }}
          {...rest}
        />
      </View>
    </Field>
  );
});
