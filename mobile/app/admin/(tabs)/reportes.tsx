import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useAdminStats } from '../../../hooks';
import {
  Card, StatCard, ScreenHeader, Skeleton,
  IconCalendarCheck, IconCalendar, IconClock, IconCheck, IconCheckCircle, IconX, IconUsers, IconStethoscope, IconChart, IconActivity,
} from '../../../components/ui';
import { EASE } from '../../../lib/motion';
import { colors } from '../../../lib/theme';
import { formatFechaLarga } from '../../../lib/format';
import type { IconProps } from '../../../components/ui/Icon';

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
  return (
    <View className="flex-row items-center gap-2 mt-5 mb-3">
      <View className="w-7 h-7 rounded-lg bg-rail items-center justify-center"><Icon size={13} color={colors.brand[300]} /></View>
      <Text className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">{title}</Text>
    </View>
  );
}

export default function ReportesScreen() {
  const { data: stats, isLoading, isRefetching, refetch } = useAdminStats();

  const tasaCancelacion = stats ? Math.round((stats.turnos.cancelados / (stats.turnos.total || 1)) * 100) : 0;
  const tasaComplecion = stats ? Math.round((stats.turnos.completados / (stats.turnos.total || 1)) * 100) : 0;

  const estados = [
    { label: 'Pendientes', value: stats?.turnos.pendientes ?? 0, color: colors.warning.DEFAULT },
    { label: 'Confirmados', value: stats?.turnos.confirmados ?? 0, color: colors.brand[600] },
    { label: 'Completados', value: stats?.turnos.completados ?? 0, color: colors.success.DEFAULT },
    { label: 'Cancelados', value: stats?.turnos.cancelados ?? 0, color: colors.danger.DEFAULT },
  ];
  const totalTurnos = stats?.turnos.total ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Análisis" title="Reportes" subtitle={formatFechaLarga(new Date().toISOString())} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
      >
        {isLoading ? (
          <View className="gap-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-card" />)}</View>
        ) : (
          <>
            <View className="flex-row gap-3">
              <View className="flex-1"><StatCard label="Turnos hoy" value={stats?.turnos.hoy ?? 0} icon={<IconCalendarCheck size={18} color="#fff" />} tone="brand" /></View>
              <View className="flex-1"><StatCard label="Este mes" value={stats?.turnos.mes ?? 0} icon={<IconCalendar size={18} color="#fff" />} tone="info" /></View>
            </View>

            <SectionTitle icon={IconChart} title="Estado de turnos" />
            <Card className="p-4 gap-3.5">
              {estados.map((e, i) => {
                const pct = totalTurnos ? Math.round((e.value / totalTurnos) * 100) : 0;
                return (
                  <View key={e.label}>
                    <View className="flex-row items-center mb-1.5">
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.color }} className="mr-2" />
                      <Text className="flex-1 text-[14px] font-semibold text-slate-700">{e.label}</Text>
                      <Text className="text-[15px] font-bold" style={{ color: e.color }}>{e.value}</Text>
                      <Text className="text-[12px] text-slate-400 ml-2 w-9 text-right">{pct}%</Text>
                    </View>
                    <AnimatedBar pct={pct} color={e.color} delay={i * 80} />
                  </View>
                );
              })}
            </Card>

            <SectionTitle icon={IconActivity} title="Indicadores clave" />
            <View className="flex-row gap-3">
              <Kpi label="Tasa cancelación" value={`${tasaCancelacion}%`} desc={tasaCancelacion > 30 ? 'Alta' : tasaCancelacion > 15 ? 'Media' : 'Normal'} color={tasaCancelacion > 30 ? colors.danger.DEFAULT : tasaCancelacion > 15 ? colors.warning.DEFAULT : colors.success.DEFAULT} icon={<IconX size={18} color={tasaCancelacion > 30 ? colors.danger.DEFAULT : tasaCancelacion > 15 ? colors.warning.DEFAULT : colors.success.DEFAULT} />} />
              <Kpi label="Tasa compleción" value={`${tasaComplecion}%`} desc={tasaComplecion >= 70 ? 'Excelente' : tasaComplecion >= 40 ? 'Regular' : 'Baja'} color={tasaComplecion >= 70 ? colors.success.DEFAULT : tasaComplecion >= 40 ? colors.warning.DEFAULT : colors.danger.DEFAULT} icon={<IconCheckCircle size={18} color={tasaComplecion >= 70 ? colors.success.DEFAULT : tasaComplecion >= 40 ? colors.warning.DEFAULT : colors.danger.DEFAULT} />} />
            </View>

            <SectionTitle icon={IconUsers} title="Sistema" />
            <View className="flex-row gap-3">
              <View className="flex-1"><StatCard label="Pacientes" value={stats?.usuarios.pacientes ?? 0} icon={<IconUsers size={18} color="#fff" />} tone="success" /></View>
              <View className="flex-1"><StatCard label="Médicos activos" value={stats?.medicos.disponibles ?? 0} icon={<IconStethoscope size={18} color="#fff" />} tone="brand" /></View>
            </View>

            {(stats?.topMedicos ?? []).length > 0 ? (
              <>
                <SectionTitle icon={IconStethoscope} title="Médicos con más turnos" />
                <Card className="overflow-hidden">
                  {stats!.topMedicos.map((m, i) => (
                    <View key={i} className={`flex-row items-center p-3.5 ${i < stats!.topMedicos.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <View className="w-8 h-8 rounded-lg bg-rail items-center justify-center mr-3"><Text className="text-white font-bold text-[13px]">#{i + 1}</Text></View>
                      <View className="flex-1">
                        <Text className="text-[14px] font-bold text-slate-900">{m.nombre}</Text>
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
                    const pct = Math.round((e.turnos / (arr[0].turnos || 1)) * 100);
                    return (
                      <View key={e.nombre}>
                        <View className="flex-row items-center mb-1.5">
                          <Text className="flex-1 text-[14px] font-semibold text-slate-700">{e.nombre}</Text>
                          <Text className="text-[11px] text-slate-400 mr-2">{e.medicos} méd.</Text>
                          <Text className="text-[15px] font-bold text-slate-900">{e.turnos}</Text>
                        </View>
                        <AnimatedBar pct={pct} color={colors.brand[600]} delay={i * 70} />
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

function Kpi({ label, value, desc, color, icon }: { label: string; value: string; desc: string; color: string; icon: React.ReactNode }) {
  return (
    <View className="flex-1 bg-surface rounded-card border border-slate-100 p-4" style={{ borderTopWidth: 3, borderTopColor: color }}>
      <View className="mb-2">{icon}</View>
      <Text className="text-[26px] font-bold" style={{ color, letterSpacing: -1 }}>{value}</Text>
      <Text className="text-[13px] font-bold text-slate-900 mt-1">{label}</Text>
      <Text className="text-[11px] text-slate-400 mt-0.5">{desc}</Text>
    </View>
  );
}
