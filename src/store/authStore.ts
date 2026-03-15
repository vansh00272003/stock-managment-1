import { create } from 'zustand';

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
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: '1',
    email: 'admin@enterprise.com',
    firstName: 'System',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
  }, // Mock logged-in user for now
  isAuthenticated: true,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
