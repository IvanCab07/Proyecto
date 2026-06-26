// Centros de salud (mismos datos que la app móvil) — única fuente para la web.
export type Coords = { lat: number; lng: number };
export type Lugar = Coords & {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  tipo: 'hospital' | 'caps';
};

export const HOSPITAL: Lugar = {
  id: 'hospital', lat: -34.6037, lng: -58.3816,
  nombre: 'Hospital Central', direccion: 'Av. Corrientes 1234, CABA', telefono: '01140000000', tipo: 'hospital',
};

export const CENTROS: Lugar[] = [
  { id: '1', lat: -34.6100, lng: -58.3750, nombre: 'Centro de Salud Norte', direccion: 'Av. Córdoba 2500', telefono: '01140010001', tipo: 'caps' },
  { id: '2', lat: -34.5980, lng: -58.3900, nombre: 'CAPS Belgrano',         direccion: 'Av. Cabildo 1500',  telefono: '01140010002', tipo: 'caps' },
  { id: '3', lat: -34.6150, lng: -58.3680, nombre: 'CAPS Sur',              direccion: 'Av. San Juan 3000', telefono: '01140010003', tipo: 'caps' },
];

export const LUGARES: Lugar[] = [HOSPITAL, ...CENTROS];

// Distancia en metros entre dos coordenadas (fórmula de haversine).
export function haversine(a: Coords, b: Coords): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

// Abre la navegación en Google Maps hacia el lugar.
export const comoLlegarUrl = (l: Lugar) =>
  `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}&travelmode=driving`;
