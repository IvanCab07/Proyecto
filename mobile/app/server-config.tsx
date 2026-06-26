import { useState } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useServerStore } from '../hooks/useServerStore';
import { probe, normalizeServerInput, ProbeResult } from '../services/serverDiscovery';
import { getApiUrl } from '../services/api';
import {
  Card, Button, Input, Spinner,
  IconX, IconWifi, IconCheck, IconCheckCircle, IconAlertTriangle, IconRefresh, IconAlertCircle,
} from '../components/ui';
import { colors } from '../lib/theme';

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

export default function ServerConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, tried, runDiscovery, applyManualUrl } = useServerStore();

  const [input, setInput]           = useState('');
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<ProbeResult | null>(null);
  const [saving, setSaving]         = useState(false);

  const connected = status === 'conectado';

  const handleTest = async () => {
    const url = normalizeServerInput(input);
    if (!url) return;
    setTesting(true); setTestResult(null);
    const result = await probe(url, 4000);
    setTestResult(result); setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await applyManualUrl(input);
    setSaving(false);
    if (result.ok) router.back();
    else setTestResult(result);
  };

  const handleRediscover = async () => { setTestResult(null); await runDiscovery(); };

  const statusTone = connected ? colors.success : status === 'buscando' ? colors.warning : colors.danger;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <Text className="text-[22px] font-bold text-slate-900" style={{ letterSpacing: -0.4 }}>Configurar servidor</Text>
          <Pressable onPress={() => router.back()} hitSlop={10} className="w-9 h-9 rounded-full items-center justify-center bg-slate-100">
            <IconX size={18} color={colors.slate[500]} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Estado actual */}
          <View className="flex-row items-center gap-3 rounded-card p-4 mb-5" style={{ backgroundColor: statusTone.soft }}>
            {status === 'buscando'
              ? <Spinner size={20} color={statusTone.text} />
              : connected
                ? <IconCheckCircle size={20} color={statusTone.text} />
                : <IconAlertCircle size={20} color={statusTone.text} />}
            <View className="flex-1">
              <Text className="font-bold text-sm" style={{ color: statusTone.text }}>
                {connected ? 'Conectado al servidor' : status === 'buscando' ? 'Buscando servidor…' : 'Sin conexión con el servidor'}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: statusTone.text, fontFamily: MONO }}>{getApiUrl()}</Text>
            </View>
          </View>

          {/* IP manual */}
          <Text className="text-[15px] font-bold text-slate-900 mb-1.5">Conectar a otra PC</Text>
          <Text className="text-[13px] text-slate-500 mb-3 leading-5">
            Escribí la IP que muestra el backend al arrancar (la marcada como RECOMENDADA).
            Podés poner solo la IP: el puerto 3000 y /api se agregan solos.
          </Text>
          <Input
            placeholder="192.168.1.50"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'visible-password'}
            value={input}
            onChangeText={(v) => { setInput(v); setTestResult(null); }}
            style={{ fontFamily: MONO }}
            className="mb-2"
          />
          {input.trim() !== '' ? (
            <Text className="text-xs text-slate-400 mb-3" style={{ fontFamily: MONO }}>Se probará: {normalizeServerInput(input)}</Text>
          ) : <View className="mb-1" />}

          <View className="flex-row gap-2.5 mb-3">
            <View className="flex-1">
              <Button variant="secondary" fullWidth onPress={handleTest} loading={testing} disabled={!input.trim()} iconLeft={<IconWifi size={16} color={colors.slate[600]} />}>
                Probar conexión
              </Button>
            </View>
            <View className="flex-1">
              <Button fullWidth onPress={handleSave} loading={saving} disabled={!testResult?.ok} iconLeft={<IconCheck size={16} color="#fff" />}>
                Guardar y usar
              </Button>
            </View>
          </View>

          {testResult ? (
            <View className="rounded-card p-3 mb-5" style={{ backgroundColor: testResult.ok ? colors.success.soft : colors.danger.soft }}>
              <Text className="font-bold text-sm" style={{ color: testResult.ok ? colors.success.text : colors.danger.text }}>
                {testResult.ok ? 'OK — El servidor respondió' : 'FALLA — No se pudo conectar'}
              </Text>
              <Text className="text-xs mt-1" style={{ fontFamily: MONO, color: testResult.ok ? colors.success.text : colors.danger.text }}>{testResult.url}</Text>
              {testResult.error ? <Text className="text-xs mt-1" style={{ color: colors.danger.text }}>{testResult.error}</Text> : null}
            </View>
          ) : null}

          <Button variant="secondary" fullWidth onPress={handleRediscover} loading={status === 'buscando'} iconLeft={<IconRefresh size={16} color={colors.slate[600]} />} className="mb-5">
            Buscar automáticamente de nuevo
          </Button>

          {tried.length > 0 ? (
            <View className="mb-5">
              <Text className="text-[15px] font-bold text-slate-900 mb-2">URLs probadas en la última búsqueda</Text>
              <Card className="overflow-hidden" flat>
                {tried.map((t, i) => (
                  <View key={t.url} className={`flex-row items-center gap-2.5 p-3 ${i === tried.length - 1 ? '' : 'border-b border-slate-100'}`}>
                    {t.ok ? <IconCheckCircle size={16} color={colors.success.DEFAULT} /> : <IconX size={16} color={colors.danger.DEFAULT} />}
                    <View className="flex-1">
                      <Text className="text-xs text-slate-900" style={{ fontFamily: MONO }}>{t.url}</Text>
                      {!t.ok && t.error ? <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={2}>{t.error}</Text> : null}
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          ) : null}

          {/* Ayuda */}
          <View className="rounded-card p-4 border border-warning/30" style={{ backgroundColor: colors.warning.soft }}>
            <View className="flex-row items-center gap-2 mb-2">
              <IconAlertTriangle size={16} color={colors.warning.text} />
              <Text className="font-bold text-sm" style={{ color: colors.warning.text }}>Si nada conecta, revisá en orden:</Text>
            </View>
            <Text className="text-[13px] leading-[21px]" style={{ color: colors.warning.text }}>
              1. El backend está corriendo en la PC (npm run dev).{'\n'}
              2. El celular y la PC están en el MISMO WiFi.{'\n'}
              3. En la PC ejecutá: npm run firewall (en la carpeta backend).{'\n'}
              4. Si el WiFi aísla dispositivos (típico en colegios), usá el hotspot del celular: conectá la PC al hotspot y volvé a probar.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
