import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin } from '../types';

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
  updateStatus: (status: Admin['status']) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      login: (token, admin) => {
        set({ token, admin, isAuthenticated: true });
      },
      logout: () => {
        set({ token: null, admin: null, isAuthenticated: false });
      },
      updateStatus: (status) => {
        set((state) => ({
          admin: state.admin ? { ...state.admin, status } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
