import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultUrl, probe, SERVER_URL_KEY, ProbeResult } from './serverDiscovery';

// baseURL inicial resuelta sin red; el discovery del arranque (useServerStore)
// y la pantalla "Configurar servidor" la pueden cambiar en caliente con setApiUrl()
let currentApiUrl = getDefaultUrl();

export const api = axios.create({
  baseURL: currentApiUrl,
  // Render free "duerme" el backend: el primer request tras inactividad puede tardar
  // ~50s (cold start). Timeout holgado para que el login no falle mientras despierta.
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

export const getApiUrl = () => currentApiUrl;

// Cambia la URL activa y la persiste para los próximos arranques
export async function setApiUrl(url: string): Promise<void> {
  currentApiUrl = url;
  api.defaults.baseURL = url;
  await AsyncStorage.setItem(SERVER_URL_KEY, url);
}

let _onUnauthorized: (() => void) | null = null;
export const registerUnauthorizedHandler = (fn: () => void) => {
  _onUnauthorized = fn;
};

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      error.message =
        `No se pudo conectar a ${currentApiUrl}. ` +
        'Abrí "Configurar servidor" en la pantalla de ingreso y probá con la IP de tu PC.';
    }
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

// Diagnóstico: prueba la URL activa contra /health
export async function pingHealth(): Promise<ProbeResult> {
  return probe(currentApiUrl);
}
