import { useEffect, useState } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useObrasSociales, useActualizarObraSocial } from '../../hooks';
import {
  Card, Button, Input, Chip, Sheet, Calendario, ScreenHeader, Skeleton, SectionHead, KeyboardAwareScrollView,
  toast, confirm, IconCalendar, IconCreditCard, IconX,
} from '../../components/ui';
import { ObraSocialResumen } from '../../components/ObraSocialResumen';
import { PressableScale } from '../../lib/motion';
import { useTheme } from '../../lib/useTheme';
import { apiError } from '../../lib/apiError';
import { aISO, claveFecha, fechaDeTurno, hoyISO } from '../../lib/fechas';
import { formatFechaLarga } from '../../lib/format';
import { validarNumeroAfiliado } from '../../lib/validaciones';

/**
 * Cobertura del paciente: elige su obra social del catálogo que arma el admin, carga el número
 * de afiliado y hasta cuándo vale la credencial. Todo viaja por PATCH /auth/perfil.
 *
 * "Particular" = obraSocialId null; en ese caso también se limpian afiliado y vencimiento para
 * no dejar datos colgados de una cobertura que ya no tiene.
 */
export default function ObraSocialScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { data: obras, isLoading, isRefetching, refetch } = useObrasSociales();
  const guardar = useActualizarObraSocial();

  const [obraSocialId, setObraSocialId] = useState<string | null>(user?.obraSocialId ?? null);
  const [numeroAfiliado, setNumeroAfiliado] = useState(user?.numeroAfiliado ?? '');
  const [vencimiento, setVencimiento] = useState<string | null>(
    user?.vencimientoObraSocial ? claveFecha(user.vencimientoObraSocial) : null,
  );
  const [verCalendario, setVerCalendario] = useState(false);
  const [errorAfiliado, setErrorAfiliado] = useState<string | undefined>();

  // Si el usuario se recarga (por ejemplo después de guardar) el formulario arranca de lo guardado.
  useEffect(() => {
    setObraSocialId(user?.obraSocialId ?? null);
    setNumeroAfiliado(user?.numeroAfiliado ?? '');
    setVencimiento(user?.vencimientoObraSocial ? claveFecha(user.vencimientoObraSocial) : null);
  }, [user?.obraSocialId, user?.numeroAfiliado, user?.vencimientoObraSocial]);

  const particular = obraSocialId === null;

  const sinCambios =
    obraSocialId === (user?.obraSocialId ?? null) &&
    numeroAfiliado.trim() === (user?.numeroAfiliado ?? '') &&
    vencimiento === (user?.vencimientoObraSocial ? claveFecha(user.vencimientoObraSocial) : null);

  const handleGuardar = async () => {
    if (!particular) {
      const err = validarNumeroAfiliado(numeroAfiliado);
      setErrorAfiliado(err);
      if (err) return;
    }

    if (particular && user?.obraSocialId) {
      const ok = await confirm({
        title: 'Quitar obra social',
        message: 'Vas a quedar como paciente particular y se borran tu número de afiliado y el vencimiento.',
        confirmText: 'Quitar',
        destructive: true,
      });
      if (!ok) return;
    }

    try {
      await guardar.mutateAsync(
        particular
          ? { obraSocialId: null, numeroAfiliado: null, vencimientoObraSocial: null }
          : {
              obraSocialId,
              numeroAfiliado: numeroAfiliado.trim() || null,
              vencimientoObraSocial: vencimiento ? aISO(vencimiento) : null,
            },
      );
      toast.success(particular ? 'Quedaste como particular' : 'Obra social guardada');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo guardar la obra social'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Mi cobertura" title="Obra social" subtitle="Con qué te atendés en la clínica" onBack={() => router.back()} />

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, gap: 14 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
      >
        <ObraSocialResumen user={user} />

        <Card className="p-5">
          <SectionHead icon={<IconCreditCard size={15} color={colors.brand[600]} />} title="Elegí tu obra social" />

          {isLoading ? (
            <View className="flex-row flex-wrap gap-2">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-24 rounded-pill" />)}
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              <Chip label="Particular" active={particular} onPress={() => setObraSocialId(null)} tone="dark" />
              {(obras ?? []).map(o => (
                <Chip key={o.id} label={o.nombre} active={obraSocialId === o.id} onPress={() => setObraSocialId(o.id)} />
              ))}
            </View>
          )}

          {!isLoading && (obras?.length ?? 0) === 0 ? (
            <Text className="text-slate-400 text-[13px] mt-3">
              La clínica todavía no cargó obras sociales. Si la tuya no aparece, consultá en recepción.
            </Text>
          ) : null}

          {!particular ? (
            <View className="mt-5">
              <Input
                label="Número de afiliado"
                placeholder="Ej: 12345678/01"
                value={numeroAfiliado}
                onChangeText={(v) => { setNumeroAfiliado(v); if (errorAfiliado) setErrorAfiliado(undefined); }}
                autoCapitalize="characters"
                error={errorAfiliado}
                className="mb-4"
              />

              <Text className="text-slate-700 text-[13px] font-semibold mb-2">Vencimiento de la credencial</Text>
              <View className="flex-row flex-wrap gap-2">
                <Chip label="Sin vencimiento" active={vencimiento === null} onPress={() => setVencimiento(null)} />
                <Chip
                  label={vencimiento ? 'Cambiar fecha' : 'Elegir fecha'}
                  active={vencimiento !== null}
                  icon={<IconCalendar size={14} color={vencimiento !== null ? '#fff' : colors.slate[500]} />}
                  onPress={() => setVerCalendario(true)}
                />
              </View>

              {vencimiento ? (
                <View className="flex-row items-center justify-between mt-3 bg-brand-50 rounded-field px-3.5 py-2.5">
                  <Text className="text-brand-700 text-[13px] font-semibold capitalize flex-1">
                    Vale hasta el {formatFechaLarga(fechaDeTurno(vencimiento).toISOString())}
                  </Text>
                  <PressableScale onPress={() => setVencimiento(null)} haptic="select" className="w-7 h-7 items-center justify-center">
                    <IconX size={14} color={colors.brand[700]} />
                  </PressableScale>
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="mt-5">
            <Button fullWidth loading={guardar.isPending} disabled={sinCambios} onPress={handleGuardar}>
              Guardar
            </Button>
          </View>
        </Card>
      </KeyboardAwareScrollView>

      <Sheet visible={verCalendario} onClose={() => setVerCalendario(false)} title="Vencimiento de la credencial">
        <Calendario
          conCard={false}
          titulo="¿Hasta cuándo vale tu credencial?"
          ayuda="Tiene que ser hoy o una fecha futura."
          seleccion={vencimiento}
          onSelect={(fecha) => { setVencimiento(fecha); setVerCalendario(false); }}
          deshabilitar={(fecha) => fecha < hoyISO()}
        />
      </Sheet>
    </View>
  );
}
