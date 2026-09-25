import { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';
import { useReenviarVerificacion, use2FASetup, use2FAEnable, use2FADisable } from '../hooks';
import { Card, Button, Input, Sheet, toast, IconShield, IconCheckCircle, IconAlertCircle } from './ui';
import { useTheme } from '../lib/useTheme';
import { apiError } from '../lib/apiError';
import type { TwoFactorSetup } from '../services';

export function SeguridadSection() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const reenviar = useReenviarVerificacion();
  const setup = use2FASetup();
  const enable = use2FAEnable();
  const disable = use2FADisable();

  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  if (!user) return null;

  const handleReenviar = async () => {
    try {
      const r = await reenviar.mutateAsync();
      toast.success(r.message);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo reenviar el email'));
    }
  };

  const abrirSetup = async () => {
    setCode('');
    try {
      const data = await setup.mutateAsync();
      setSetupData(data);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo iniciar la configuración'));
    }
  };

  const handleEnable = async () => {
    if (!/^\d{6}$/.test(code)) return toast.error('Ingresá el código de 6 dígitos');
    try {
      const r = await enable.mutateAsync(code);
      toast.success(r.message);
      setSetupData(null);
      setCode('');
    } catch (err) {
      toast.error(apiError(err, 'El código no es válido'));
    }
  };

  const handleDisable = async () => {
    if (!/^\d{6}$/.test(disableCode)) return toast.error('Ingresá el código de 6 dígitos');
    try {
      const r = await disable.mutateAsync(disableCode);
      toast.success(r.message);
      setDisableOpen(false);
      setDisableCode('');
    } catch (err) {
      toast.error(apiError(err, 'El código no es válido'));
    }
  };

  return (
    <Card className="p-5">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-8 h-8 rounded-lg bg-brand-50 items-center justify-center">
          <IconShield size={15} color={colors.brand[600]} />
        </View>
        <Text className="text-[15px] font-bold text-slate-900">Seguridad</Text>
      </View>

      {/* Verificación de email */}
      <View className="flex-row items-center py-3 border-b border-slate-100">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-semibold text-slate-900">Verificación de email</Text>
          {user.emailVerified ? (
            <View className="flex-row items-center gap-1 mt-0.5">
              <IconCheckCircle size={13} color={colors.success.text} />
              <Text className="text-[12px] font-medium" style={{ color: colors.success.text }}>Verificado</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 mt-0.5">
              <IconAlertCircle size={13} color={colors.warning.text} />
              <Text className="text-[12px] font-medium" style={{ color: colors.warning.text }}>Pendiente de verificar</Text>
            </View>
          )}
        </View>
        {!user.emailVerified && (
          <Button variant="secondary" size="sm" loading={reenviar.isPending} onPress={handleReenviar}>Reenviar</Button>
        )}
      </View>

      {/* 2FA */}
      <View className="flex-row items-center py-3">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-semibold text-slate-900">Verificación en dos pasos</Text>
          {user.twoFactorEnabled ? (
            <View className="flex-row items-center gap-1 mt-0.5">
              <IconCheckCircle size={13} color={colors.success.text} />
              <Text className="text-[12px] font-medium" style={{ color: colors.success.text }}>Activada</Text>
            </View>
          ) : (
            <Text className="text-[12px] text-slate-400 mt-0.5">Protegé tu cuenta con una app autenticadora</Text>
          )}
        </View>
        {user.twoFactorEnabled ? (
          <Button variant="secondary" size="sm" onPress={() => { setDisableCode(''); setDisableOpen(true); }}>Desactivar</Button>
        ) : (
          <Button variant="secondary" size="sm" loading={setup.isPending} onPress={abrirSetup}>Activar</Button>
        )}
      </View>

      {/* Sheet: configurar 2FA */}
      <Sheet visible={!!setupData} onClose={() => setSetupData(null)} title="Activar verificación en dos pasos">
        {setupData && (
          <View>
            <Text className="text-sm text-slate-500 mb-3">1. Escaneá este QR con Google Authenticator, Authy o similar.</Text>
            <View className="items-center mb-3">
              <Image source={{ uri: setupData.qr }} style={{ width: 176, height: 176, borderRadius: 12 }} />
            </View>
            <Text className="text-sm text-slate-500 mb-1.5">¿No podés escanear? Ingresá esta clave manualmente:</Text>
            <View className="bg-slate-50 rounded-field px-3 py-2.5 mb-4 border border-slate-200">
              <Text className="text-center text-[13px] text-slate-700">{setupData.secret}</Text>
            </View>
            <Input
              label="2. Código de 6 dígitos"
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              className="mb-4"
            />
            <Button fullWidth loading={enable.isPending} onPress={handleEnable}>Activar 2FA</Button>
          </View>
        )}
      </Sheet>

      {/* Sheet: desactivar 2FA */}
      <Sheet visible={disableOpen} onClose={() => setDisableOpen(false)} title="Desactivar verificación en dos pasos">
        <Text className="text-sm text-slate-500 mb-3">Ingresá un código actual de tu app autenticadora para confirmar.</Text>
        <Input
          label="Código de 6 dígitos"
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={disableCode}
          onChangeText={(v) => setDisableCode(v.replace(/\D/g, '').slice(0, 6))}
          className="mb-4"
        />
        <Button fullWidth variant="danger" loading={disable.isPending} onPress={handleDisable}>Desactivar 2FA</Button>
      </Sheet>
    </Card>
  );
}
