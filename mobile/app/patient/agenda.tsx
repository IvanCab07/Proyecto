import { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView, TextInput, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated from 'react-native-reanimated';
import {
  useTomasHoy,
  useMisTurnos,
  useMisRecetas,
  useMisRecordatorios,
  useMarcarToma,
  useActualizarHorarios,
} from '../../hooks';
import {
  Card,
  ScreenHeader,
  EmptyState,
  Skeleton,
  Button,
  SegmentedTabs,
  Sheet,
  toast,
  IconClock,
  IconPill,
  IconCheck,
  IconCheckCircle,
  IconX,
  IconEdit,
  IconCalendar,
  IconPlus,
  IconTrash,
  IconBell,
} from '../../components/ui';
import { TurnosPanel } from '../../components/paciente/TurnosPanel';
import { RecetasPanel } from '../../components/paciente/RecetasPanel';
import { PressableScale, stagger } from '../../lib/motion';
import { haptic } from '../../lib/haptics';
import { useTheme } from '../../lib/useTheme';
import {
  solicitarPermisosNotificaciones,
  sincronizarRecordatoriosLocales,
  dispararNotificacionPrueba,
  suscribirRespuestaNotificacion,
} from '../../lib/notifications';
import type { TomaTimeline, RecordatorioSalud } from '../../services';

type Tab = 'tomas' | 'tratamientos' | 'turnos' | 'recetas';

// Cuatro pestañas en un control segmentado: con labels más largos ("Tomas de hoy") se
// truncan en pantallas angostas.
const TABS: { key: Tab; label: string }[] = [
  { key: 'tomas', label: 'Tomas' },
  { key: 'tratamientos', label: 'Tratam.' },
  { key: 'turnos', label: 'Turnos' },
  { key: 'recetas', label: 'Recetas' },
];

const esTab = (v: unknown): v is Tab => TABS.some(t => t.key === v);

export default function AgendaScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  // `?tab=turnos` permite abrir la agenda directo en una pestaña.
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(esTab(params.tab) ? params.tab : 'tomas');
  // Si la agenda ya estaba abierta y llega otro `?tab` (se tocó una notificación), cambia de pestaña.
  useEffect(() => {
    if (esTab(params.tab)) setTab(params.tab);
  }, [params.tab]);
  const { data: turnos = [] } = useMisTurnos();
  const { data: recetas = [] } = useMisRecetas();
  const turnosProximos = turnos.filter(t => t.status === 'PENDIENTE' || t.status === 'CONFIRMADO' || t.status === 'EN_ESPERA').length;
  const esMedicacion = tab === 'tomas' || tab === 'tratamientos';

  // Queries
  const { data: tomas = [], isLoading: loadingTomas, isRefetching: refetchingTomas, refetch: refetchTomas } = useTomasHoy();
  const { data: recordatorios = [], isLoading: loadingRecs, isRefetching: refetchingRecs, refetch: refetchRecs } = useMisRecordatorios();

  // Mutations
  const marcarToma = useMarcarToma();
  const actualizarHorarios = useActualizarHorarios();

  // Estado para el modal de edición de horarios
  const [editingRecordatorio, setEditingRecordatorio] = useState<RecordatorioSalud | null>(null);
  const [tempHorarios, setTempHorarios] = useState<string[]>([]);
  const [nuevoHorarioInput, setNuevoHorarioInput] = useState('');
  const [probandoNotif, setProbandoNotif] = useState(false);

  // Solicitar permisos al entrar
  useEffect(() => {
    solicitarPermisosNotificaciones();
  }, []);

  // Sincronizar recordatorios activos con las alarmas del teléfono
  useEffect(() => {
    if (recordatorios && recordatorios.length > 0) {
      sincronizarRecordatoriosLocales(recordatorios);
    }
  }, [recordatorios]);

  // Escuchar cuando el usuario toca una notificación
  useEffect(() => {
    return suscribirRespuestaNotificacion(data => {
      if (data?.tipo === 'MEDICAMENTO' || data?.tipo === 'MEDICAMENTO_PRUEBA') {
        setTab('tomas');
      }
    });
  }, []);

  const handleProbarNotificacion = async () => {
    try {
      setProbandoNotif(true);
      haptic.select();
      await dispararNotificacionPrueba(5);
      haptic.success();
      toast.success('¡Alarma programada! En 5 seg te llega. Bloqueá el celu o salí de la app para probar.');
    } catch (err: any) {
      console.error('[Error al probar notificacion]:', err);
      toast.error(err?.message || 'No se pudo programar la notificación.');
    } finally {
      setProbandoNotif(false);
    }
  };

  const tomasCompletadas = tomas.filter(t => t.estado === 'TOMADO').length;
  const tomasPendientes = tomas.filter(t => t.estado === 'PENDIENTE' || t.estado === 'POSPUESTO').length;

  const handleMarcar = async (toma: TomaTimeline, nuevoEstado: 'TOMADO' | 'OMITIDO') => {
    try {
      haptic.select();
      await marcarToma.mutateAsync({
        recordatorioId: toma.recordatorioId,
        data: {
          fechaProgramada: toma.fechaProgramada,
          estado: nuevoEstado,
        },
      });
      if (nuevoEstado === 'TOMADO') {
        haptic.success();
        toast.success(`Marcado como tomado: ${toma.titulo}`);
      } else {
        toast.info(`Toma omitida`);
      }
    } catch {
      toast.error('No se pudo actualizar la toma');
    }
  };

  const openEditarHorarios = (rec: RecordatorioSalud) => {
    setEditingRecordatorio(rec);
    setTempHorarios(Array.isArray(rec.horarios) ? [...rec.horarios] : ['09:00']);
    setNuevoHorarioInput('');
  };

  const handleEliminarHorario = (index: number) => {
    if (tempHorarios.length <= 1) {
      toast.info('Debe haber al menos un horario de toma');
      return;
    }
    setTempHorarios(prev => prev.filter((_, i) => i !== index));
  };

  const handleAgregarHorario = () => {
    const val = nuevoHorarioInput.trim();
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(val)) {
      toast.error('Ingresá una hora válida en formato HH:MM (ej: 08:30 o 21:00)');
      return;
    }
    if (tempHorarios.includes(val)) {
      toast.info('Ese horario ya está en la lista');
      return;
    }
    setTempHorarios(prev => [...prev, val].sort());
    setNuevoHorarioInput('');
  };

  const aplicarPreset = (preset: string[]) => {
    setTempHorarios([...preset]);
  };

  const handleGuardarHorarios = async () => {
    if (!editingRecordatorio) return;
    if (tempHorarios.length === 0) {
      toast.error('Debe haber al menos un horario configurado');
      return;
    }
    try {
      await actualizarHorarios.mutateAsync({
        id: editingRecordatorio.id,
        horarios: tempHorarios,
      });
      toast.success('Horarios actualizados');
      setEditingRecordatorio(null);
    } catch {
      toast.error('No se pudieron actualizar los horarios');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        eyebrow="Salud & Bienestar"
        title="Mi Agenda"
        subtitle={
          tab === 'tomas'
            ? `${tomasCompletadas} de ${tomas.length} tomas realizadas hoy`
            : tab === 'tratamientos'
            ? `${recordatorios.length} tratamiento${recordatorios.length !== 1 ? 's' : ''} activo${recordatorios.length !== 1 ? 's' : ''}`
            : tab === 'turnos'
            ? `${turnosProximos} turno${turnosProximos !== 1 ? 's' : ''} próximo${turnosProximos !== 1 ? 's' : ''}`
            : `${recetas.length} receta${recetas.length !== 1 ? 's' : ''} emitida${recetas.length !== 1 ? 's' : ''}`
        }
        onBack={() => router.back()}
        right={esMedicacion ? (
          <PressableScale
            onPress={handleProbarNotificacion}
            haptic="select"
            className="flex-row items-center gap-1.5 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-full"
          >
            <IconBell size={14} color={colors.brand[600]} />
            <Text className="text-xs font-bold text-brand-700">
              {probandoNotif ? 'Enviando...' : 'Probar'}
            </Text>
          </PressableScale>
        ) : undefined}
      />

      {/* Banner de prueba rápida para verificar notificaciones en el teléfono */}
      {esMedicacion ? (
      <View className="px-4 pt-1 pb-2">
        <PressableScale
          onPress={handleProbarNotificacion}
          haptic="select"
          className="p-3 rounded-2xl bg-brand-50/80 border border-brand-200 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
            <View className="w-8 h-8 rounded-full bg-brand-600 items-center justify-center">
              <IconBell size={16} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-brand-900">Probar notificación en 5 seg</Text>
              <Text className="text-[11px] text-brand-700">
                Tocá acá, salí de la app o bloqueá la pantalla para ver cómo llega la alarma.
              </Text>
            </View>
          </View>
          <View className="bg-brand-600 px-2.5 py-1 rounded-full">
            <Text className="text-[11px] font-bold text-white">Probar</Text>
          </View>
        </PressableScale>
      </View>
      ) : null}

      <View className="px-4 py-2">
        <SegmentedTabs
          tabs={TABS}
          value={tab}
          onChange={(k) => setTab(k as Tab)}
        />
      </View>

      {tab === 'turnos' ? (
        <TurnosPanel paddingBottom={40} />
      ) : tab === 'recetas' ? (
        <RecetasPanel paddingBottom={40} />
      ) : tab === 'tomas' ? (
        loadingTomas ? (
          <View className="p-4 gap-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-28 rounded-card" />)}
          </View>
        ) : (
          <FlatList
            data={tomas}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refetchingTomas}
                onRefresh={refetchTomas}
                tintColor={colors.brand[500]}
              />
            }
            ListHeaderComponent={
              tomas.length > 0 ? (
                <View className="mb-2 p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-full bg-brand-600 items-center justify-center">
                      <IconCheckCircle size={18} color="#fff" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-brand-900">Progreso de hoy</Text>
                      <Text className="text-[11px] text-brand-700">
                        {tomasPendientes === 0
                          ? '¡Completaste todas tus tomas de hoy!'
                          : `Te quedan ${tomasPendientes} toma${tomasPendientes !== 1 ? 's' : ''} pendiente${tomasPendientes !== 1 ? 's' : ''}`}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base font-extrabold text-brand-700">
                    {tomas.length > 0 ? Math.round((tomasCompletadas / tomas.length) * 100) : 0}%
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                className="pt-16"
                icon={<IconPill size={32} color={colors.brand[500]} />}
                title="Sin tomas para hoy"
                message="Cuando un médico te recete medicamentos o agregues tratamientos, aparecerán acá ordenados por hora."
              />
            }
            renderItem={({ item, index }) => (
              <Animated.View entering={stagger(index)}>
                <Card className={`p-4 ${item.estado === 'TOMADO' ? 'opacity-80 bg-slate-50/80' : ''}`}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{
                          backgroundColor:
                            item.estado === 'TOMADO'
                              ? colors.success.soft
                              : item.estado === 'OMITIDO'
                              ? colors.slate[200]
                              : colors.brand[50],
                        }}
                      >
                        {item.estado === 'TOMADO' ? (
                          <IconCheck size={20} color={colors.success.text} />
                        ) : item.estado === 'OMITIDO' ? (
                          <IconX size={20} color={colors.slate[500]} />
                        ) : (
                          <IconClock size={20} color={colors.brand[600]} />
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs font-bold text-brand-700">{item.hora} HS</Text>
                          {item.estado === 'TOMADO' && (
                            <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                              <Text className="text-[10px] font-bold text-emerald-800">Tomado</Text>
                            </View>
                          )}
                          {item.estado === 'OMITIDO' && (
                            <View className="bg-slate-200 px-2 py-0.5 rounded-full">
                              <Text className="text-[10px] font-bold text-slate-700">Omitido</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-base font-bold text-slate-900 mt-0.5" numberOfLines={1}>
                          {item.titulo}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {(item.dosis || item.instrucciones) && (
                    <View className="mt-2.5 pt-2.5 border-t border-slate-100 gap-1">
                      {item.dosis && (
                        <Text className="text-xs font-semibold text-slate-700">
                          Dosis: <Text className="font-normal text-slate-600">{item.dosis}</Text>
                        </Text>
                      )}
                      {item.instrucciones && (
                        <Text className="text-[11px] text-slate-500 italic" numberOfLines={2}>
                          "{item.instrucciones}"
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Acciones para marcar */}
                  {item.estado !== 'TOMADO' ? (
                    <View className="flex-row items-center gap-2 mt-3.5">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        iconLeft={<IconCheck size={16} color="#fff" />}
                        onPress={() => handleMarcar(item, 'TOMADO')}
                      >
                        Tomar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        iconLeft={<IconX size={15} color={colors.slate[600]} />}
                        onPress={() => handleMarcar(item, 'OMITIDO')}
                      >
                        Omitir
                      </Button>
                    </View>
                  ) : (
                    <View className="mt-3 flex-row items-center justify-between">
                      <Text className="text-[11px] text-slate-400">
                        {item.fechaRealizada ? `Registrado a las ${new Date(item.fechaRealizada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Completado'}
                      </Text>
                      <PressableScale
                        onPress={() => handleMarcar(item, 'OMITIDO')}
                        className="py-1 px-2 rounded-lg"
                      >
                        <Text className="text-[11px] font-medium text-slate-500 underline">Deshacer</Text>
                      </PressableScale>
                    </View>
                  )}
                </Card>
              </Animated.View>
            )}
          />
        )
      ) : (
        /* Pestaña: Mis Tratamientos */
        loadingRecs ? (
          <View className="p-4 gap-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-36 rounded-card" />)}
          </View>
        ) : (
          <FlatList
            data={recordatorios}
            keyExtractor={r => r.id}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refetchingRecs}
                onRefresh={refetchRecs}
                tintColor={colors.brand[500]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                className="pt-16"
                icon={<IconCalendar size={32} color={colors.brand[500]} />}
                title="Sin tratamientos activos"
                message="Tus tratamientos y recetas médicas aparecerán acá para que ajustes los horarios a tu conveniencia."
              />
            }
            renderItem={({ item, index }) => (
              <Animated.View entering={stagger(index)}>
                <Card className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-10 h-10 rounded-xl bg-brand-50 items-center justify-center">
                        <IconPill size={20} color={colors.brand[600]} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-900">{item.titulo}</Text>
                        {item.receta?.medico && (
                          <Text className="text-xs text-slate-500">
                            Dr. {item.receta.medico.apellido}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {item.dosis && (
                    <Text className="text-xs text-slate-700 mt-2 font-medium">
                      Dosis: <Text className="font-normal text-slate-600">{item.dosis}</Text>
                    </Text>
                  )}

                  {/* Horarios de toma configurados */}
                  <View className="mt-3 pt-3 border-t border-slate-100">
                    <Text className="text-xs font-bold text-slate-700 mb-1.5">
                      Horarios de recordatorio:
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                      {(Array.isArray(item.horarios) ? item.horarios : []).map(h => (
                        <View key={h} className="bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                          <IconClock size={12} color={colors.brand[600]} />
                          <Text className="text-xs font-bold text-brand-800">{h} hs</Text>
                        </View>
                      ))}
                    </View>

                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<IconEdit size={14} color={colors.slate[700]} />}
                      onPress={() => openEditarHorarios(item)}
                    >
                      Ajustar horarios
                    </Button>
                  </View>
                </Card>
              </Animated.View>
            )}
          />
        )
      )}

      {/* Modal / Sheet para editar horarios de un recordatorio */}
      <Sheet
        visible={!!editingRecordatorio}
        onClose={() => setEditingRecordatorio(null)}
        title="Ajustar horarios de toma"
      >
        <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
          <Text className="text-sm font-bold text-slate-800 mb-1">
            {editingRecordatorio?.titulo}
          </Text>
          <Text className="text-xs text-slate-500 mb-4">
            Elegí las horas exactas en las que querés tomar o realizar este tratamiento.
          </Text>

          {/* Presets rápidos */}
          <Text className="text-xs font-bold text-slate-700 mb-2">Frecuencia sugerida:</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            <Pressable
              onPress={() => aplicarPreset(['09:00'])}
              className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200"
            >
              <Text className="text-xs font-medium text-slate-700">1 vez (09:00)</Text>
            </Pressable>
            <Pressable
              onPress={() => aplicarPreset(['08:00', '20:00'])}
              className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200"
            >
              <Text className="text-xs font-medium text-slate-700">c/ 12hs (08, 20)</Text>
            </Pressable>
            <Pressable
              onPress={() => aplicarPreset(['08:00', '16:00', '00:00'])}
              className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200"
            >
              <Text className="text-xs font-medium text-slate-700">c/ 8hs (08, 16, 00)</Text>
            </Pressable>
            <Pressable
              onPress={() => aplicarPreset(['06:00', '12:00', '18:00', '00:00'])}
              className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200"
            >
              <Text className="text-xs font-medium text-slate-700">c/ 6hs</Text>
            </Pressable>
          </View>

          {/* Lista actual de horarios con botón eliminar */}
          <Text className="text-xs font-bold text-slate-700 mb-2">Horarios configurados:</Text>
          <View className="gap-2 mb-4">
            {tempHorarios.map((h, i) => (
              <View key={`${h}-${i}`} className="flex-row items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <View className="flex-row items-center gap-2">
                  <IconClock size={16} color={colors.brand[600]} />
                  <Text className="text-sm font-bold text-slate-800">{h} hs</Text>
                </View>
                <Pressable
                  onPress={() => handleEliminarHorario(i)}
                  className="p-1 rounded-md"
                >
                  <IconTrash size={16} color={colors.danger.DEFAULT} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Agregar horario manual */}
          <View className="flex-row items-center gap-2 mb-6">
            <TextInput
              value={nuevoHorarioInput}
              onChangeText={setNuevoHorarioInput}
              placeholder="Ej: 14:30"
              placeholderTextColor={colors.slate[400]}
              maxLength={5}
              keyboardType="numbers-and-punctuation"
              className="flex-1 h-11 px-3 bg-surface border border-slate-200 rounded-field text-sm text-slate-900"
            />
            <Button
              variant="secondary"
              size="md"
              iconLeft={<IconPlus size={16} color={colors.slate[700]} />}
              onPress={handleAgregarHorario}
            >
              Agregar
            </Button>
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={actualizarHorarios.isPending}
            onPress={handleGuardarHorarios}
          >
            Guardar horarios
          </Button>
        </ScrollView>
      </Sheet>
    </View>
  );
}
