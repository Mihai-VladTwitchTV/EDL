import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'EMPLOYEE' | 'MASTER_MENTOR' | 'HR_ADMIN';
  department?: string;
  departmentId?: string;
  sectionId?: string;
  sectionName?: string;
  avatarUrl?: string;
  preferredLang: 'RO' | 'EN';
  xpPoints?: number;
  level?: number;
  streakDays?: number;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: object) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userStr = await SecureStore.getItemAsync('user_profile');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const { accessToken, user } = res.data;
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('user_profile', JSON.stringify(user));
    set({ token: accessToken, user });
  },

  register: async (data) => {
    const res = await authApi.register(data);
    const { accessToken, user } = res.data;
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('user_profile', JSON.stringify(user));
    set({ token: accessToken, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user_profile');
    set({ token: null, user: null });
  },
}));
