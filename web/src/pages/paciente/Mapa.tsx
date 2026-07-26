import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PageTransition } from '../../components/PageTransition';
import { Card, PageHeader, Button } from '../../ui';
import {
  IconMapPin, IconPhone, IconStethoscope, IconBuilding, IconAlert, IconArrowRight,
} from '../../ui/icons';
import {
  LUGARES, HOSPITAL, haversine, fmtDist, comoLlegarUrl, type Coords, type Lugar,
} from '../../lib/centros';
import { cn } from '../../lib/cn';

// Pin HTML coloreado (evita el problema de los íconos por defecto de Leaflet con bundlers).
function pinIcon(color: string) {
  return L.divIcon({
    className: 'border-0 bg-transparent',
    html: `<div style="color:${color}">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
        <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/>
        <circle cx="12" cy="10" r="2.6" fill="white" stroke="none"/>
      </svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -26],
  });
}

const ICON_HOSPITAL = pinIcon('#16A34A');
const ICON_CAPS = pinIcon('#0EA5E9');

// Centra el mapa en el lugar seleccionado de forma imperativa.
function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 0.6 });
  }, [center, map]);
  return null;
}

export default function PacienteMapa() {
  const [userPos, setUserPos] = useState<Coords | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(HOSPITAL.id);
  const [flyCenter, setFlyCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) { setGeoDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoDenied(true),
      { timeout: 8000, enableHighAccuracy: false },
    );
  }, []);

  const lugares = useMemo(
    () => LUGARES.map(l => ({ ...l, distancia: userPos ? haversine(userPos, l) : null }))
      .sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity)),
    [userPos],
  );

  const focus = (l: Lugar) => {
    setSelectedId(l.id);
    setFlyCenter([l.lat, l.lng]);
  };

  const llamar = (tel: string) => { window.location.href = `tel:${tel}`; };

  return (
    <PageTransition>
      <PageHeader
        title="Centros y mapa"
        description="Ubicá el hospital y los centros de salud cercanos, cómo llegar y a quién llamar."
      />

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {/* Mapa */}
        <Card className="lg:col-span-2 overflow-hidden p-0">
          {/* leaflet-dark: filtro sobre los tiles de OSM, que solo vienen en claro */}
          <div className="h-[360px] sm:h-[460px] lg:h-[620px] leaflet-dark">
            <MapContainer
              center={[HOSPITAL.lat, HOSPITAL.lng]}
              zoom={14}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {lugares.map(l => (
                <Marker
                  key={l.id}
                  position={[l.lat, l.lng]}
                  icon={l.tipo === 'hospital' ? ICON_HOSPITAL : ICON_CAPS}
                  eventHandlers={{ click: () => setSelectedId(l.id) }}
                >
                  <Popup>
                    <span className="font-semibold">{l.nombre}</span>
                    <br />
                    {l.direccion}
                    <br />
                    <a href={comoLlegarUrl(l)} target="_blank" rel="noopener noreferrer">Cómo llegar →</a>
                  </Popup>
                </Marker>
              ))}
              {userPos && (
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={120}
                  pathOptions={{ color: '#16A34A', fillColor: '#22C55E', fillOpacity: 0.4 }}
                />
              )}
              <FlyTo center={flyCenter} />
            </MapContainer>
          </div>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-4">
          {geoDenied && (
            <Card className="p-4 bg-warning-soft ring-1 ring-warning/20">
              <div className="flex items-start gap-2.5">
                <IconAlert className="w-4 h-4 text-warning-text shrink-0 mt-0.5" />
                <p className="text-[13px] text-warning-text font-medium">
                  Activá la ubicación del navegador para ver tu posición y las distancias a cada centro.
                </p>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-bold text-slate-900 text-sm mb-3 px-1">Centros de salud</h3>
            <div className="space-y-2">
              {lugares.map(l => (
                <div
                  key={l.id}
                  className={cn(
                    'rounded-field ring-1 ring-inset transition-colors p-3',
                    l.id === selectedId ? 'ring-brand-300 bg-brand-50/50' : 'ring-slate-100',
                  )}
                >
                  <button type="button" onClick={() => focus(l)} className="w-full flex items-center gap-3 text-left">
                    <span
                      className={cn(
                        'w-10 h-10 rounded-xl grid place-items-center shrink-0 [&>svg]:w-5 [&>svg]:h-5',
                        l.tipo === 'hospital' ? 'bg-brand-50 text-brand-600' : 'bg-info-soft text-info-text',
                      )}
                    >
                      {l.tipo === 'hospital' ? <IconBuilding /> : <IconStethoscope />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-slate-900 truncate">{l.nombre}</span>
                      <span className="block text-xs text-slate-500 truncate">{l.direccion}</span>
                    </span>
                    {l.distancia != null && (
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 rounded-pill px-2 py-1 shrink-0 tnum">
                        {fmtDist(l.distancia)}
                      </span>
                    )}
                  </button>
                  <div className="flex gap-2 mt-2.5">
                    <Button
                      size="sm"
                      className="flex-1"
                      iconLeft={<IconMapPin />}
                      onClick={() => window.open(comoLlegarUrl(l), '_blank', 'noopener,noreferrer')}
                    >
                      Cómo llegar
                    </Button>
                    <Button variant="secondary" size="sm" iconLeft={<IconPhone />} onClick={() => llamar(l.telefono)}>
                      Llamar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-danger-soft ring-1 ring-danger/20">
            <div className="flex items-center gap-2 mb-3">
              <IconAlert className="w-4 h-4 text-danger-text" />
              <h3 className="font-bold text-danger-text text-sm">Emergencias</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="danger" size="sm" iconLeft={<IconPhone />} onClick={() => llamar('107')}>
                107 SAME
              </Button>
              <Button variant="danger" size="sm" iconLeft={<IconPhone />} onClick={() => llamar('911')}>
                911
              </Button>
            </div>
            <p className="text-[12px] text-danger-text/80 mt-2.5">
              107 (ambulancias / SAME) · 911 (policía y emergencias).
            </p>
          </Card>

          <Card className="p-4 bg-brand-50 ring-1 ring-brand-100">
            <span className="w-9 h-9 rounded-lg bg-brand-600 text-white grid place-items-center mb-3 [&>svg]:w-5 [&>svg]:h-5">
              <IconBuilding />
            </span>
            <p className="text-sm font-semibold text-brand-900">{HOSPITAL.nombre}</p>
            <p className="text-[13px] text-brand-800/80 mt-1 mb-3">{HOSPITAL.direccion}</p>
            <Button
              size="sm"
              iconRight={<IconArrowRight />}
              onClick={() => window.open(comoLlegarUrl(HOSPITAL), '_blank', 'noopener,noreferrer')}
            >
              Ir al hospital
            </Button>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
