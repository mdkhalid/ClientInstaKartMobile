import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api';
import type { User, LoginRequest, RegisterRequest } from '../types';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [token, userStr] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  login: async (data: LoginRequest) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(data);
      const { user, accessToken } = res.data.data!;
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, accessToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      ]);
      set({ user, token: accessToken, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(data);
      const { user, accessToken } = res.data.data!;
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, accessToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      ]);
      set({ user, token: accessToken, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ user: null, token: null });
  },

  setUser: (user: User) => {
    set({ user });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
}));
