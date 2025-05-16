// src/app/context/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { apiService } from '@/lib';

export type UserRole = 'super_admin' | 'admin' | 'employee';
export type OfficeId = string;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  canAccessOffice: (officeId: OfficeId) => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is logged in
    const checkAuth = async () => {
      try {
        // For now, simulate auth with localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Connect to the real API for login
      const result = await apiService.users.login(email, password);
      
      // Store token for API requests
      localStorage.setItem('auth_token', result.token);
      
      // Set the user
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  };

  const canAccessOffice = (officeId: OfficeId) => {
    if (!user) return false;
    
    // Super admin can access all offices
    if (user.role === 'super_admin') return true;
    
    // Other roles can only access their assigned office
    return user.officeId === officeId;
  };

  const canAccess = (requiredRole: UserRole) => {
    if (!user) return false;
    
    // Access levels hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      'super_admin': 3,
      'admin': 2,
      'employee': 1
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, canAccessOffice, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};