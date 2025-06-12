// stores/useAuthStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authApi } from '@/api/auth.api';
import { User, LoginRequest, RegisterRequest } from '@/types/auth.types';
import { tokenManager } from '@/api/config';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authApi.login(credentials);
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.detail || 'Login failed',
            });
            throw error;
          }
        },
        
        register: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authApi.register(data);
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.detail || 'Registration failed',
            });
            throw error;
          }
        },
        
        logout: async () => {
          set({ isLoading: true });
          try {
            await authApi.logout();
          } finally {
            tokenManager.clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },
        
        checkAuth: async () => {
          const token = tokenManager.getAccessToken();
          if (!token) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }
          
          set({ isLoading: true });
          try {
            const user = await authApi.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            tokenManager.clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },
        
        clearError: () => set({ error: null }),
        
        updateUser: (userData) => {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, ...userData },
            });
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);