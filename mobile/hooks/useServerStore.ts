import { create } from 'zustand';
import { discoverServer, ProbeResult } from '../services/serverDiscovery';
import { setApiUrl, getApiUrl } from '../services/api';

type ServerStatus = 'buscando' | 'conectado' | 'sin-servidor';

// El backend se resuelve solo por autodescubrimiento. Ya no existe la pantalla donde el usuario
// tipeaba una IP a mano, así que tampoco está `applyManualUrl`: la única acción disponible es
// reintentar la búsqueda, y la ofrece el gate de arranque (app/index.tsx) cuando falla.
interface ServerState {
  status: ServerStatus;
  url: string | null;
  tried: ProbeResult[];
  runDiscovery: () => Promise<boolean>;
}

export const useServerStore = create<ServerState>((set) => ({
  status: 'buscando',
  url: getApiUrl(),
  tried: [],

  // Busca el backend entre las URLs candidatas; si alguna responde la fija como baseURL
  runDiscovery: async () => {
    set({ status: 'buscando' });
    const { url, tried } = await discoverServer();
    if (url) {
      await setApiUrl(url);
      set({ status: 'conectado', url, tried });
      return true;
    }
    set({ status: 'sin-servidor', url: null, tried });
    return false;
  },
}));
