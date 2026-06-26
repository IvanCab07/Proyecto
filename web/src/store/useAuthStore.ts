import { create } from 'zustand';
import { authService } from '../services';
import type { User, RegisterDTO, LoginResult } from '../services';
import { registerUnauthorizedHandler } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeTwoFactor: (challenge: string, code: string) => Promise<void>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('auth_token');
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

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));

registerUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});
