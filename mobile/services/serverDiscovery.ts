import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PORT = 3000;

// Una sola clave: guarda tanto la última URL que funcionó como la ingresada a mano
export const SERVER_URL_KEY = 'hospital.api_url';

export type ProbeResult = { url: string; ok: boolean; error?: string };

// IP de la PC donde corre Metro: casi siempre es la misma donde corre el backend
function getMetroHostUrl(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return `http://${host}:${PORT}/api`;
}

// Acepta "192.168.1.50", "192.168.1.50:3000" o una URL completa,
// y la normaliza a http://host:3000/api (a las https, p.ej. túneles, no les agrega puerto)
export function normalizeServerInput(input: string): string {
  let url = input.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  const match = url.match(/^(https?):\/\/([^/]+)(\/.*)?$/i);
  if (!match) return url;
  const [, scheme, host, rawPath] = match;
  const isHttps = scheme.toLowerCase() === 'https';
  const hostWithPort = host.includes(':') || isHttps ? host : `${host}:${PORT}`;
  const path = (rawPath ?? '').replace(/\/+$/, '');
  const finalPath = path.endsWith('/api') ? path : `${path}/api`;
  return `${scheme}://${hostWithPort}${finalPath}`;
}

// URLs candidatas en orden de prioridad (gana la primera que responda)
export function buildCandidates(savedUrl: string | null): string[] {
  const candidates: (string | null)[] = [
    process.env.EXPO_PUBLIC_API_URL || null,                          // 1) override manual / túnel
    savedUrl,                                                         // 2) última URL que funcionó
    Platform.OS === 'web' ? `http://localhost:${PORT}/api` : null,    // 3) web: mismo host
    getMetroHostUrl(),                                                // 4) IP de la PC de desarrollo
    Platform.OS === 'android' ? `http://10.0.2.2:${PORT}/api` : null, // 5) emulador Android
    `http://localhost:${PORT}/api`,                                   // 6) último recurso
  ];
  return [...new Set(candidates.filter((c): c is string => !!c))];
}

// Mejor URL inicial sin tocar la red (para que axios tenga baseURL antes del discovery)
export function getDefaultUrl(): string {
  return buildCandidates(null)[0];
}

// ¿La URL apunta a un backend remoto (https o host que no es LAN/localhost)?
// Esos (p. ej. Render free) pueden estar "dormidos" y tardar en responder el primer probe,
// así que les damos un timeout más largo que a un servidor de la red local.
export function isRemoteUrl(url: string): boolean {
  if (/^https:\/\//i.test(url)) return true;
  const host = url.replace(/^https?:\/\//i, '').split(/[:/]/)[0];
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2') return false;
  if (/^192\.168\./.test(host) || /^10\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  return true; // dominio público u otra IP fuera de la LAN
}

// GET /health con un axios pelado (sin interceptores ni token).
// Si no se pasa timeout, se elige según sea remoto (10s, tolera cold start) o local (2.5s).
export async function probe(url: string, timeoutMs?: number): Promise<ProbeResult> {
  const timeout = timeoutMs ?? (isRemoteUrl(url) ? 10000 : 2500);
  try {
    const res = await axios.get(`${url}/health`, { timeout });
    if (res.data?.ok === true) return { url, ok: true };
    return { url, ok: false, error: 'Respondió, pero no parece la API del hospital' };
  } catch (e: any) {
    return { url, ok: false, error: e?.message ?? 'Sin respuesta' };
  }
}

// Prueba todas las candidatas en paralelo y devuelve la de mayor prioridad que respondió,
// junto con el detalle de cada intento (para mostrarlo en "Configurar servidor")
export async function discoverServer(): Promise<{ url: string | null; tried: ProbeResult[] }> {
  const saved = await AsyncStorage.getItem(SERVER_URL_KEY);
  const candidates = buildCandidates(saved);
  const tried = await Promise.all(candidates.map((url) => probe(url)));
  const winner = tried.find((r) => r.ok) ?? null;

  // Si fijaste el backend por env (EXPO_PUBLIC_API_URL), confiamos en esa URL aunque el
  // primer probe haya expirado: un backend remoto puede estar despertando (cold start de
  // Render free). Así no mandamos al usuario a "Configurar servidor" por una URL correcta
  // que solo respondió lento; el request real la reintenta con un timeout más holgado.
  const envUrl = process.env.EXPO_PUBLIC_API_URL || null;
  return { url: winner?.url ?? envUrl, tried };
}
