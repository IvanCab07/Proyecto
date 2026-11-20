import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService, User, LoginResult } from '../services';
import { queryClient } from '../lib/queryClient';


interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login:    (email: string, password: string) => Promise<LoginResult>;
  completeTwoFactor: (challenge: string, code: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout:   () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({

  user: null,
  isLoading: true,
  isAuthenticated: false,

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        set({ user: null, isAuthenticated: false });
        return;
      }
      const user = await authService.me();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const result = await authService.login({ email, password });
      // Si la cuenta tiene 2FA, todavía no hay sesión: se completa en el 2do paso
      if ('token' in result) {
        queryClient.clear(); // que no queden datos de otra cuenta usada en este celular
        set({ user: result.user, isAuthenticated: true });
      }
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  completeTwoFactor: async (challenge, code) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.twoFactorLogin(challenge, code);
      queryClient.clear();
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.register(data);
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authService.logout();
    // Vaciar la caché: el próximo que entre en este celular no tiene que ver datos de esta cuenta
    queryClient.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
