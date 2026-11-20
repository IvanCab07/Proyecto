import { QueryClient } from '@tanstack/react-query';

/**
 * Caché de React Query compartida por toda la app.
 * Vive en su propio archivo para que el store de sesión pueda vaciarla al entrar o salir:
 * si no, el usuario que entra después ve datos guardados del anterior (por ejemplo, la
 * cobertura de una obra social que el paciente ya cambió).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});
