// api/user.api.ts

import { apiRequest } from './config';
import { User, UserRole } from '@/types/auth.types';
import { ListResponse } from '@/types/common.types';

interface UserSearchFilters {
  q?: string | null;
  role?: UserRole | null;
  is_active?: boolean | null;
  is_verified?: boolean | null;
  office_id?: string | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
}

interface PasswordChange {
  current_password: string;
  new_password: string;
}

export const userApi = {
  // List users (admin)
  listUsers: async (filters?: UserSearchFilters): Promise<ListResponse<User>> => {
    return apiRequest('get', '/users', { params: filters });
  },
  
  getUserById: async (id: string): Promise<User> => {
    return apiRequest('get', `/users/${id}`);
  },
  
  createUser: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: string | null;
  }): Promise<User> => {
    return apiRequest('post', '/users', data);
  },
  
  updateUser: async (id: string, data: UserUpdate): Promise<User> => {
    return apiRequest('put', `/users/${id}`, data);
  },
  
  deleteUser: async (id: string): Promise<void> => {
    await apiRequest('delete', `/users/${id}`);
  },
  
  // User actions
  activateUser: async (id: string): Promise<User> => {
    return apiRequest('post', `/users/${id}/activate`);
  },
  
  deactivateUser: async (id: string, reason?: string): Promise<User> => {
    return apiRequest('post', `/users/${id}/deactivate`, { reason });
  },
  
  verifyUser: async (id: string): Promise<User> => {
    return apiRequest('post', `/users/${id}/verify`);
  },
  
  changeUserRole: async (id: string, newRole: UserRole): Promise<User> => {
    return apiRequest('post', `/users/${id}/change-role`, { new_role: newRole });
  },
  
  // Password management
  changePassword: async (id: string, data: PasswordChange): Promise<void> => {
    await apiRequest('post', `/users/${id}/change-password`, data);
  },
  
  resetPassword: async (id: string): Promise<{ temporary_password: string }> => {
    return apiRequest('post', `/users/${id}/reset-password`);
  },
  
  // Profile picture
  uploadProfilePicture: async (id: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiRequest('post', `/users/${id}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteProfilePicture: async (id: string): Promise<void> => {
    await apiRequest('delete', `/users/${id}/profile-picture`);
  },
  
  // User activity
  getUserActivity: async (id: string, days?: number): Promise<any> => {
    return apiRequest('get', `/users/${id}/activity`, { params: { days } });
  },
  
  getUserLoginHistory: async (id: string, limit?: number): Promise<any> => {
    return apiRequest('get', `/users/${id}/login-history`, { params: { limit } });
  },
};