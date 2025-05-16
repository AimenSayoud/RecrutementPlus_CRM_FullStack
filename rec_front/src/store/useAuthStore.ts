// src/store/useAuthStore.ts
import { create } from 'zustand';
import { User } from '@/types';
import { apiService } from '@/lib';
import { persist } from 'zustand/middleware';

export type UserRole = 'super_admin' | 'admin' | 'employee';
export type OfficeId = string;

interface AuthState {
  // User state
  user: User | null;
  token: string | null;
  
  // Loading and error states
  isLoading: boolean;
  error: Error | null;
  
  // Session state
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  
  // Permission helpers
  canAccessOffice: (officeId: OfficeId) => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      
      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await apiService.users.login(email, password);
          
          // Store token and user data
          set({ 
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false 
          });
          
          // Store token in localStorage for API requests
          localStorage.setItem('auth_token', result.token);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error : new Error('Authentication failed'), 
            isLoading: false,
            isAuthenticated: false
          });
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }
        
        try {
          // For now, we'll just check if token exists
          // In a real scenario, you would validate the token with the server
          set({ isAuthenticated: true });
          return true;
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          });
          return false;
        }
      },
      
      clearError: () => {
        set({ error: null });
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
        
        return roleHierarchy[user.role as UserRole] >= roleHierarchy[requiredRole];
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);