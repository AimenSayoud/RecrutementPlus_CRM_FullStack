// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

export type UserRole = 'super_admin' | 'admin' | 'employee';
export type OfficeId = '1' | '2' | '3';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  officeId: OfficeId;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  canAccessOffice: (officeId: OfficeId) => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
  initializeAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      // State
      user: null,
      isLoading: true,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
          }

          const data = await response.json();
          const { user, tokens } = data;

          // Store tokens in localStorage
          localStorage.setItem('access_token', tokens.access_token);
          localStorage.setItem('refresh_token', tokens.refresh_token);

          set({ 
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              officeId: user.office_id,
            }, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint
          const token = localStorage.getItem('access_token');
          if (token) {
            await fetch('http://localhost:8000/api/v1/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear tokens and state regardless of API call success
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      canAccessOffice: (officeId: OfficeId) => {
        const { user } = get();
        if (!user) return false;
        
        // Super admin can access all offices
        if (user.role === 'super_admin') return true;
        
        // Other roles can only access their assigned office
        return user.officeId === officeId;
      },

      canAccess: (requiredRole: UserRole) => {
        const { user } = get();
        if (!user) return false;
        
        // Access levels hierarchy
        const roleHierarchy: Record<UserRole, number> = {
          'super_admin': 3,
          'admin': 2,
          'employee': 1
        };
        
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ isLoading: false });
            return;
          }

          // Verify token with backend
          const response = await fetch('http://localhost:8000/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const user = await response.json();
            set({ 
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                officeId: user.office_id,
              }, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          // Set loading to false after rehydration
          if (state) {
            state.setLoading(false);
          }
        },
      }
    )
  )
);

// Create stable selectors for SSR compatibility
export const selectUser = (state: AuthStore) => state.user;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectCanAccess = (state: AuthStore) => state.canAccess;
export const selectCanAccessOffice = (state: AuthStore) => state.canAccessOffice;
export const selectLogin = (state: AuthStore) => state.login;
export const selectLogout = (state: AuthStore) => state.logout;