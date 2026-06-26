import { create } from 'zustand';
import { discoverServer, probe, normalizeServerInput, ProbeResult } from '../services/serverDiscovery';
import { setApiUrl, getApiUrl } from '../services/api';

type ServerStatus = 'buscando' | 'conectado' | 'sin-servidor';

interface ServerState {
  status: ServerStatus;
  url: string | null;
  tried: ProbeResult[];
  runDiscovery: () => Promise<boolean>;
  applyManualUrl: (input: string) => Promise<ProbeResult>;
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

  // Prueba una IP/URL escrita por el usuario y, si responde, la guarda y la usa
  applyManualUrl: async (input: string) => {
    const url = normalizeServerInput(input);
    if (!url) return { url: input, ok: false, error: 'Ingresá una IP o URL' };
    const result = await probe(url, 4000);
    if (result.ok) {
      await setApiUrl(url);
      set({ status: 'conectado', url });
    }
    return result;
  },
}));
