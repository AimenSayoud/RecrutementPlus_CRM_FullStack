// api/auth.api.ts

import { apiClient, apiRequest, tokenManager } from './config';
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RefreshResponse,
  User,
  AuthStatusResponse,
} from '@/types/auth.types';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email); // API expects username field
    formData.append('password', credentials.password);
    
    const response = await apiClient.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Store tokens
    tokenManager.setTokens(
      response.data.tokens.access_token,
      response.data.tokens.refresh_token
    );
    
    return response.data;
  },
  
  // Register
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('post', '/auth/register', data);
    
    // Store tokens
    tokenManager.setTokens(
      response.tokens.access_token,
      response.tokens.refresh_token
    );
    
    return response;
  },
  
  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiRequest('post', '/auth/logout');
    } finally {
      tokenManager.clearTokens();
    }
  },
  
  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return apiRequest<User>('get', '/auth/me');
  },
  
  // Refresh token
  refreshToken: async (): Promise<RefreshResponse> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiRequest<RefreshResponse>('post', '/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    // Update access token
    tokenManager.setTokens(response.access_token, refreshToken);
    
    return response;
  },
  
  // Check auth status
  checkAuthStatus: async (): Promise<AuthStatusResponse> => {
    try {
      const user = await authApi.getCurrentUser();
      return {
        is_authenticated: true,
        user,
      };
    } catch {
      return {
        is_authenticated: false,
        user: null,
      };
    }
  },
  
  // Change password
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await apiRequest('post', '/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
  
  // Request password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiRequest('post', '/auth/reset-password-request', { email });
  },
  
  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiRequest('post', '/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  },
  
  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await apiRequest('post', '/auth/verify-email', { token });
  },
};