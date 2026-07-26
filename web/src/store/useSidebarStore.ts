import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Rail lateral colapsable (80px solo iconos ↔ 256px con etiquetas).
// Se recuerda entre sesiones para no obligar a re-expandirlo en cada visita.
interface SidebarState {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      expanded: false,
      setExpanded: (expanded) => set({ expanded }),
      toggle: () => set({ expanded: !get().expanded }),
    }),
    { name: 'hospital-sidebar' },
  ),
);
