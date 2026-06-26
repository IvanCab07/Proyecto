import axios from 'axios';

// Extrae el mensaje de error que envía el backend ({ error: string }) o cae al fallback.
// Si no hubo respuesta (caída de red o timeout), da un mensaje claro: en Render free el
// backend "duerme" y el primer request puede tardar en responder (cold start).
export function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof msg === 'string' && msg) return msg;
    if (!err.response) {
      return 'No se pudo contactar al servidor. Si recién abrís la app puede estar ' +
        'despertando: esperá unos segundos y reintentá.';
    }
  }
  return fallback;
}
