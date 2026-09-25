import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

// Preferencia de tema, con la misma clave y los mismos valores que la web
// (web/src/store/useThemeStore.ts): 'system' sigue al tema del teléfono, 'light'/'dark' lo
// fuerzan.
//
// Quien manda sobre el tema es NativeWind: colorScheme.set() reescribe las variables de
// global.css para todos los className y re-renderiza lo que use useColorScheme(). Este store
// solo guarda la elección y se la reenvía al arrancar. Ojo: sin `darkMode: 'class'` en
// tailwind.config.js, colorScheme.set() tira error — los dos van de la mano.
//
// Persistimos a mano en vez de con el middleware `persist` para seguir el patrón del resto de
// los stores del proyecto (ver useServerStore).

const THEME_KEY = 'hospital-theme';

export type ThemePref = 'light' | 'dark' | 'system';

const ES_PREF = (v: string | null): v is ThemePref =>
  v === 'light' || v === 'dark' || v === 'system';

interface ThemeState {
  pref: ThemePref;
  /** Lee la preferencia guardada y la aplica. Se llama una vez, en el arranque. */
  load: () => Promise<void>;
  setPref: (pref: ThemePref) => void;
  /** Rota claro → oscuro → sistema, para el botón de los heros. */
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  pref: 'system',

  load: async () => {
    try {
      const guardado = await AsyncStorage.getItem(THEME_KEY);
      if (ES_PREF(guardado)) {
        colorScheme.set(guardado);
        set({ pref: guardado });
      }
    } catch {
      // Si el storage falla no hay nada que hacer: queda 'system', que es un default válido.
    }
  },

  setPref: (pref) => {
    colorScheme.set(pref);
    set({ pref });
    AsyncStorage.setItem(THEME_KEY, pref).catch(() => {});
  },

  toggle: () => {
    const orden: ThemePref[] = ['light', 'dark', 'system'];
    get().setPref(orden[(orden.indexOf(get().pref) + 1) % orden.length]);
  },
}));
