import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useAdminStats } from '../../../hooks';
import {
  Card, ScreenHeader, SegmentedTabs, Skeleton,
  IconChart, IconActivity, IconUsers, IconStethoscope,
} from '../../../components/ui';
import { EASE } from '../../../lib/motion';
import { useTheme } from '../../../lib/useTheme';
import { formatFechaLarga } from '../../../lib/format';
import type { IconProps } from '../../../components/ui/Icon';
import type { TrendPoint } from '../../../services';

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  const sv = useSharedValue(0);
  useEffect(() => { sv.value = withDelay(delay, withTiming((w * pct) / 100, { duration: 700, easing: EASE.outExpo })); }, [w, pct]);
  const st = useAnimatedStyle(() => ({ width: sv.value }));
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <Animated.View style={[st, { height: '100%', backgroundColor: color, borderRadius: 999 }]} />
    </View>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: (p: IconProps) => any; title: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center gap-2 mt-5 mb-3">
      <View className="w-7 h-7 rounded-lg bg-rail items-center justify-center"><Icon size={13} color={colors.brand[300]} /></View>
      <Text className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">{title}</Text>
    </View>
  );
}

// Mini gráfico de barras verticales (datos reales del backend), sin librerías.
function TrendBars({ data, height = 92 }: { data: TrendPoint[]; height?: number }) {
  const { colors } = useTheme();
  const max = Math.max(...data.map(d => d.total), 1);
  const labelEvery = data.length > 8 ? Math.ceil(data.length / 5) : 1;
  return (
    <View>
      <View className="flex-row items-end gap-[3px]" style={{ height }}>
        {data.map((d, i) => (
          <View key={i} className="flex-1 items-center justify-end" style={{ height }}>
            <Text className="text-[9px] text-slate-400 mb-1" style={{ opacity: d.total > 0 ? 1 : 0 }}>{d.total}</Text>
            <View style={{ width: '64%', height: Math.max(3, (d.total / max) * (height - 16)), backgroundColor: colors.brand[600], borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          </View>
        ))}
      </View>
      <View className="flex-row gap-[3px] mt-1.5">
        {data.map((d, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-[9px] text-slate-400">{i % labelEvery === 0 ? d.label : ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ReportesScreen() {
  const { colors } = useTheme();
  const { data: stats, isLoading, isRefetching, refetch } = useAdminStats();
  const [periodo, setPeriodo] = useState('dias');

  const t = stats?.turnos;
  const pct = (n: number) => (t && t.total ? Math.round((n / t.total) * 100) : 0);

  const kpis = t ? [
    { label: 'Total', value: String(t.total), color: colors.slate[900] },
    { label: 'Hoy', value: String(t.hoy), color: colors.brand[700] },
    { label: 'Compleción', value: `${pct(t.completados)}%`, color: colors.success.text },
    { label: 'Cancelación', value: `${pct(t.cancelados)}%`, color: pct(t.cancelados) > 25 ? colors.danger.text : colors.slate[900] },
  ] : [];

  const estados = [
    { label: 'Pendientes', value: t?.pendientes ?? 0, color: colors.warning.DEFAULT },
    { label: 'Confirmados', value: t?.confirmados ?? 0, color: colors.brand[600] },
    { label: 'Completados', value: t?.completados ?? 0, color: colors.success.DEFAULT },
    { label: 'Cancelados', value: t?.cancelados ?? 0, color: colors.danger.DEFAULT },
  ];
  const totalTurnos = t?.total ?? 0;

  const trendData = periodo === 'dias' ? (stats?.tendencia.dias ?? []) : (stats?.tendencia.meses ?? []);
  const trendTotal = trendData.reduce((acc, d) => acc + d.total, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Análisis" title="Reportes" subtitle={formatFechaLarga(new Date().toISOString())} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
      >
        {isLoading ? (
          <View className="gap-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-card" />)}</View>
        ) : (
          <>
            {/* KPI strip */}
            <Card className="p-0 overflow-hidden">
              <View className="flex-row">
                {kpis.map((k, i) => (
                  <View key={k.label} className={`flex-1 px-3 py-4 ${i > 0 ? 'border-l border-slate-100' : ''}`}>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" numberOfLines={1}>{k.label}</Text>
                    <Text className="text-[21px] font-bold mt-1.5" style={{ color: k.color, letterSpacing: -0.5 }}>{k.value}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* Tendencia */}
            <SectionTitle icon={IconActivity} title="Turnos creados" />
            <Card className="p-4">
              {/* El selector va en su propia línea y no compartiendo un flex-row con el texto:
                  con dos etiquetas largas necesita el ancho completo de la tarjeta. */}
              <SegmentedTabs
                value={periodo}
                onChange={setPeriodo}
                tabs={[{ key: 'dias', label: '14 días' }, { key: 'meses', label: '6 meses' }]}
              />
              <Text className="text-[12px] text-slate-500 mt-3 mb-3">
                {trendTotal} {trendTotal === 1 ? 'turno' : 'turnos'} en {periodo === 'dias' ? 'los últimos 14 días' : 'los últimos 6 meses'}
              </Text>
              {trendTotal === 0 ? (
                <Text className="text-sm text-slate-400 py-6 text-center">Sin turnos en este período.</Text>
              ) : (
                <TrendBars data={trendData} />
              )}
            </Card>

            {/* Estado de turnos */}
            <SectionTitle icon={IconChart} title="Estado de turnos" />
            <Card className="p-4 gap-3.5">
              {estados.map((e, i) => {
                const p = totalTurnos ? Math.round((e.value / totalTurnos) * 100) : 0;
                return (
                  <View key={e.label}>
                    <View className="flex-row items-center mb-1.5">
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.color }} className="mr-2" />
                      <Text className="flex-1 text-[14px] font-semibold text-slate-700">{e.label}</Text>
                      <Text className="text-[15px] font-bold" style={{ color: e.color }}>{e.value}</Text>
                      <Text className="text-[12px] text-slate-400 ml-2 w-9 text-right">{p}%</Text>
                    </View>
                    <AnimatedBar pct={p} color={e.color} delay={i * 80} />
                  </View>
                );
              })}
            </Card>

            {/* Sistema */}
            <SectionTitle icon={IconUsers} title="Sistema" />
            <Card className="p-0 overflow-hidden">
              <View className="flex-row">
                <View className="flex-1 px-4 py-4">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pacientes</Text>
                  <Text className="text-[21px] font-bold text-slate-900 mt-1.5" style={{ letterSpacing: -0.5 }}>{stats?.usuarios.pacientes ?? 0}</Text>
                </View>
                <View className="flex-1 px-4 py-4 border-l border-slate-100">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Médicos activos</Text>
                  <Text className="text-[21px] font-bold text-brand-700 mt-1.5" style={{ letterSpacing: -0.5 }}>{stats?.medicos.disponibles ?? 0}</Text>
                </View>
              </View>
            </Card>

            {(stats?.topMedicos ?? []).length > 0 ? (
              <>
                <SectionTitle icon={IconStethoscope} title="Médicos con más turnos" />
                <Card className="overflow-hidden">
                  {stats!.topMedicos.map((m, i) => (
                    <View key={i} className={`flex-row items-center p-3.5 ${i < stats!.topMedicos.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <View className="w-7 h-7 rounded-md bg-slate-100 items-center justify-center mr-3"><Text className="text-slate-500 font-bold text-[12px]">{i + 1}</Text></View>
                      <View className="flex-1">
                        <Text className="text-[14px] font-bold text-slate-900" numberOfLines={1}>{m.nombre.replace('Dr. ', '')}</Text>
                        <Text className="text-[12px] text-slate-500 mt-0.5">{m.especialidad}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[18px] font-bold text-brand-700" style={{ letterSpacing: -0.5 }}>{m.total}</Text>
                        <Text className="text-[10px] text-slate-400 font-semibold">turnos</Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            ) : null}

            {(stats?.porEspecialidad ?? []).length > 0 ? (
              <>
                <SectionTitle icon={IconStethoscope} title="Turnos por especialidad" />
                <Card className="p-4 gap-3.5">
                  {[...stats!.porEspecialidad].sort((a, b) => b.turnos - a.turnos).map((e, i, arr) => {
                    const p = Math.round((e.turnos / (arr[0].turnos || 1)) * 100);
                    return (
                      <View key={e.nombre}>
                        <View className="flex-row items-center mb-1.5">
                          <Text className="flex-1 text-[14px] font-semibold text-slate-700">{e.nombre}</Text>
                          <Text className="text-[11px] text-slate-400 mr-2">{e.medicos} méd.</Text>
                          <Text className="text-[15px] font-bold text-slate-900">{e.turnos}</Text>
                        </View>
                        <AnimatedBar pct={p} color={colors.brand[600]} delay={i * 70} />
                      </View>
                    );
                  })}
                </Card>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
