import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

// El tema vive como clase `dark` en <html>; los tokens de src/index.css hacen el resto.
// index.html aplica la clase antes de pintar leyendo esta misma clave de localStorage.
const apply = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

const preferred = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: preferred(),
      setTheme: (theme) => {
        apply(theme);
        set({ theme });
      },
      toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
    }),
    {
      name: 'hospital-theme',
      onRehydrateStorage: () => (state) => {
        apply(state?.theme ?? preferred());
      },
    },
  ),
);
