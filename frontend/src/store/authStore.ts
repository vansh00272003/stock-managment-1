import { create } from 'zustand';
import api from '@/lib/api';

export type Role = 'SUPER_ADMIN' | 'STOCK_MANAGER' | 'STANDARD_USER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user, token) => {
    localStorage.setItem('auth-token', token);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('auth-token');
    set({ user: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('auth-token');
      set({ user: null, isAuthenticated: false });
    }
  },
}));

