import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3000/api';

// URL completa del API (con /api) y base del backend (sin /api, para archivos en /uploads).
// Único lugar donde se derivan: evita recalcularlas en cada página y desincronizarse.
export const apiUrl = BASE_URL;
export const apiBaseUrl = BASE_URL.replace(/\/api\/?$/, '');

export const api = axios.create({
  baseURL: BASE_URL,
  // Render free "duerme" el servicio: el primer request tras un rato de inactividad
  // puede tardar ~50s en responder (cold start). Timeout holgado para no fallar de entrada.
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

let _onUnauthorized: (() => void) | null = null;
export const registerUnauthorizedHandler = (fn: () => void) => {
  _onUnauthorized = fn;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);
