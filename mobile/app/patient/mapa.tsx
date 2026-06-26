import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Spinner, actionSheet,
  IconMapPin, IconAlertCircle, IconArrowLeft, IconPhone, IconHospital, IconStethoscope,
} from '../../components/ui';
import { PressableScale } from '../../lib/motion';
import { colors, gradients, shadow } from '../../lib/theme';

type Coords = { latitude: number; longitude: number };
type Lugar = Coords & { id: string; nombre: string; direccion: string; telefono: string; tipo: 'hospital' | 'caps' };

const HOSPITAL: Lugar = {
  id: 'hospital', latitude: -34.6037, longitude: -58.3816,
  nombre: 'Hospital Central', direccion: 'Av. Corrientes 1234, CABA', telefono: '01140000000', tipo: 'hospital',
};

const CENTROS: Lugar[] = [
  { id: '1', latitude: -34.6100, longitude: -58.3750, nombre: 'Centro de Salud Norte', direccion: 'Av. Córdoba 2500', telefono: '01140010001', tipo: 'caps' },
  { id: '2', latitude: -34.5980, longitude: -58.3900, nombre: 'CAPS Belgrano',        direccion: 'Av. Cabildo 1500',  telefono: '01140010002', tipo: 'caps' },
  { id: '3', latitude: -34.6150, longitude: -58.3680, nombre: 'CAPS Sur',             direccion: 'Av. San Juan 3000', telefono: '01140010003', tipo: 'caps' },
];

const LUGARES: Lugar[] = [HOSPITAL, ...CENTROS];

function haversine(a: Coords, b: Coords): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
const comoLlegar = (l: Lugar) =>
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${l.latitude},${l.longitude}&travelmode=driving`);
const llamar = (l: Lugar) => Linking.openURL(`tel:${l.telefono}`);

export default function MapaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Coords | null>(null);
  const [permDenied, setPermDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(HOSPITAL.id);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch { /* sin fix de GPS: seguimos sin distancias */ }
      } else {
        setPermDenied(true);
      }
      setLoading(false);
    })();
  }, []);

  const lugares = useMemo(
    () => LUGARES.map((l) => ({ ...l, distancia: location ? haversine(location, l) : null })),
    [location],
  );
  const selected = lugares.find((l) => l.id === selectedId) ?? lugares[0];

  const focus = (l: Lugar) => {
    setSelectedId(l.id);
    mapRef.current?.animateToRegion(
      { latitude: l.latitude, longitude: l.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      450,
    );
  };

  const handleEmergencia = () => {
    actionSheet({
      title: 'Llamada de emergencia',
      message: 'Elegí a quién llamar',
      options: [
        { label: '107 — SAME (ambulancias)', onPress: () => Linking.openURL('tel:107'), destructive: true },
        { label: '911 — Policía / emergencias', onPress: () => Linking.openURL('tel:911'), destructive: true },
      ],
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={gradients.railHero} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={26} color={colors.brand[400]} />
        <Text className="text-slate-400 text-sm mt-3">Cargando centros de salud…</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: HOSPITAL.latitude, longitude: HOSPITAL.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {lugares.map((l) => (
          <Marker
            key={l.id}
            coordinate={l}
            title={l.nombre}
            description={l.direccion}
            pinColor={l.tipo === 'hospital' ? colors.brand[600] : colors.info.DEFAULT}
            onPress={() => setSelectedId(l.id)}
          />
        ))}
      </MapView>

      {/* Back */}
      <PressableScale
        onPress={() => router.back()}
        haptic="select"
        style={[{ position: 'absolute', top: insets.top + 8, right: 12 }, shadow.card]}
        className="w-10 h-10 rounded-full bg-surface items-center justify-center"
      >
        <IconArrowLeft size={18} color={colors.slate[700]} />
      </PressableScale>

      {/* Aviso de permiso de ubicación */}
      {permDenied ? (
        <PressableScale
          onPress={() => Linking.openSettings()}
          haptic="select"
          style={[{ position: 'absolute', top: insets.top + 8, left: 12, right: 64 }, shadow.card]}
          className="flex-row items-center gap-2 bg-surface rounded-card px-3 py-2.5"
        >
          <IconAlertCircle size={16} color={colors.warning.text} />
          <Text className="flex-1 text-[12px] font-semibold text-slate-700">
            Activá la ubicación para ver tu posición y las distancias. Tocá para abrir Ajustes.
          </Text>
        </PressableScale>
      ) : null}

      {/* Panel inferior: carrusel de centros + acciones */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 12 }}
        >
          {lugares.map((l) => {
            const active = l.id === selectedId;
            return (
              <PressableScale
                key={l.id}
                onPress={() => focus(l)}
                haptic="select"
                style={[shadow.pop, { width: 260, borderWidth: active ? 2 : 0, borderColor: colors.brand[500] }]}
                className="bg-surface rounded-card p-3.5"
              >
                <View className="flex-row items-center gap-2.5">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: l.tipo === 'hospital' ? colors.brand[50] : colors.info.soft }}
                  >
                    {l.tipo === 'hospital'
                      ? <IconHospital size={18} color={colors.brand[600]} />
                      : <IconStethoscope size={18} color={colors.info.DEFAULT} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-slate-900" numberOfLines={1}>{l.nombre}</Text>
                    <Text className="text-[12px] text-slate-500" numberOfLines={1}>{l.direccion}</Text>
                  </View>
                  {l.distancia != null ? (
                    <View className="bg-slate-100 rounded-pill px-2 py-1">
                      <Text className="text-[11px] font-bold text-slate-600">{fmtDist(l.distancia)}</Text>
                    </View>
                  ) : null}
                </View>
                <View className="flex-row gap-2 mt-3">
                  <PressableScale
                    onPress={() => comoLlegar(l)}
                    haptic="medium"
                    className="flex-1 flex-row items-center justify-center gap-1.5 bg-brand-600 rounded-field h-10"
                  >
                    <IconMapPin size={14} color="#fff" />
                    <Text className="text-white font-bold text-[13px]">Cómo llegar</Text>
                  </PressableScale>
                  <PressableScale
                    onPress={() => llamar(l)}
                    haptic="medium"
                    className="flex-row items-center justify-center gap-1.5 bg-slate-100 rounded-field h-10 px-3"
                  >
                    <IconPhone size={14} color={colors.slate[700]} />
                    <Text className="text-slate-700 font-bold text-[13px]">Llamar</Text>
                  </PressableScale>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>

        <View className="px-4 flex-row gap-3">
          <PressableScale
            onPress={() => selected && comoLlegar(selected)}
            haptic="medium"
            style={shadow.pop}
            className="flex-1 flex-row items-center justify-center gap-2 bg-surface rounded-card h-[52px]"
          >
            <IconMapPin size={18} color={colors.brand[600]} />
            <Text className="text-brand-700 font-bold text-sm">Ir a {selected?.nombre.split(' ')[0]}</Text>
          </PressableScale>
          <PressableScale
            onPress={handleEmergencia}
            haptic="warning"
            style={shadow.pop}
            className="flex-1 flex-row items-center justify-center gap-2 bg-danger rounded-card h-[52px]"
          >
            <IconAlertCircle size={18} color="#fff" />
            <Text className="text-white font-bold text-sm">EMERGENCIA</Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}
