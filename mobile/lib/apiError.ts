import axios from 'axios';

// Siempre devuelve un string para mostrar. Toma el { error } del backend, y si fue
// un error de red (sin respuesta) usa el mensaje claro que arma services/api.ts.
export function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: unknown } | undefined;
    if (typeof data?.error === 'string' && data.error) return data.error;
    if (!err.response && typeof err.message === 'string' && err.message) return err.message;
  }
  return fallback;
}
