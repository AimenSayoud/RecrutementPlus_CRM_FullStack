// api/admin.api.ts

import { apiRequest } from './config';
import {
  AdminProfile,
  AdminProfileUpdate,
  AdminAuditLog,
  SystemConfiguration,
  AdminNotification,
  AdminSearchFilters,
  AdminListResponse,
  AuditLogSearchFilters,
  AuditLogListResponse,
} from '@/types/admin.types';

export const adminApi = {
  // Profile
  getMyAdminProfile: async (): Promise<AdminProfile> => {
    return apiRequest('get', '/admin/me');
  },
  
  updateMyAdminProfile: async (data: AdminProfileUpdate): Promise<AdminProfile> => {
    return apiRequest('put', '/admin/me', data);
  },
  
  // Admin management (superadmin)
  listAdmins: async (filters?: AdminSearchFilters): Promise<AdminListResponse> => {
    return apiRequest('get', '/admin/admins', { params: filters });
  },
  
  getAdminById: async (id: string): Promise<AdminProfile> => {
    return apiRequest('get', `/admin/admins/${id}`);
  },
  
  createAdmin: async (data: any): Promise<AdminProfile> => {
    return apiRequest('post', '/admin/admins', data);
  },
  
  updateAdminPermissions: async (id: string, permissions: any): Promise<AdminProfile> => {
    return apiRequest('put', `/admin/admins/${id}/permissions`, permissions);
  },
  
  suspendAdmin: async (id: string, reason: string): Promise<void> => {
    await apiRequest('post', `/admin/admins/${id}/suspend`, { reason });
  },
  
  // Audit logs
  getAuditLogs: async (filters?: AuditLogSearchFilters): Promise<AuditLogListResponse> => {
    return apiRequest('get', '/admin/audit-logs', { params: filters });
  },
  
  getAuditLogById: async (id: string): Promise<AdminAuditLog> => {
    return apiRequest('get', `/admin/audit-logs/${id}`);
  },
  
  // System configuration
  getSystemConfigs: async (category?: string): Promise<SystemConfiguration[]> => {
    return apiRequest('get', '/admin/system-configs', { params: { category } });
  },
  
  getSystemConfig: async (key: string): Promise<SystemConfiguration> => {
    return apiRequest('get', `/admin/system-configs/${key}`);
  },
  
  updateSystemConfig: async (key: string, value: any): Promise<SystemConfiguration> => {
    return apiRequest('put', `/admin/system-configs/${key}`, { value });
  },
  
  // Notifications
  getAdminNotifications: async (unreadOnly?: boolean): Promise<AdminNotification[]> => {
    return apiRequest('get', '/admin/notifications', { params: { unread_only: unreadOnly } });
  },
  
  markNotificationAsRead: async (id: string): Promise<void> => {
    await apiRequest('post', `/admin/notifications/${id}/read`);
  },
  
  // Dashboard stats
  getAdminDashboardStats: async (): Promise<any> => {
    return apiRequest('get', '/admin/dashboard-stats');
  },
  
  // User management
  getUserStats: async (): Promise<any> => {
    return apiRequest('get', '/admin/user-stats');
  },
  
  // System health
  getSystemHealth: async (): Promise<any> => {
    return apiRequest('get', '/admin/system-health');
  },
};