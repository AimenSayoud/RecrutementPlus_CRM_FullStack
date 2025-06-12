// types/admin.types.ts

import { AdminStatus, AdminRole, PermissionLevel } from './enums';

export interface AdminProfile {
  id: string;
  user_id: string;
  employee_id?: string | null;
  department?: string | null;
  admin_level: number;
  permissions: Record<string, PermissionLevel>;
  can_manage_users: boolean;
  can_manage_jobs: boolean;
  can_manage_companies: boolean;
  can_view_analytics: boolean;
  can_manage_system: boolean;
  status: AdminStatus;
  assigned_regions?: string[] | null;
  supervised_admin_ids?: string[] | null;
  max_actions_per_day?: number | null;
  last_action_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: any;
}

export interface AdminProfileUpdate {
  department?: string | null;
  permissions?: Record<string, PermissionLevel>;
  assigned_regions?: string[] | null;
  max_actions_per_day?: number | null;
}

export interface SuperAdminProfile extends AdminProfile {
  can_manage_admins: boolean;
  can_access_all_data: boolean;
  system_access_level: string;
  emergency_access_enabled: boolean;
  api_key_management: boolean;
  audit_access_level: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id?: string | null;
  superadmin_id?: string | null;
  action_type: string;
  resource_type?: string | null;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  changes_summary?: string | null;
  status: string;
  error_message?: string | null;
  reason?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  
  // Relations
  admin_name?: string | null;
  superadmin_name?: string | null;
}

export interface SystemConfiguration {
  id: string;
  config_key: string;
  config_value: any;
  config_type: string;
  description?: string | null;
  category?: string | null;
  is_sensitive: boolean;
  is_public: boolean;
  validation_rules?: Record<string, any> | null;
  default_value?: any;
  is_active: boolean;
  last_modified_by?: string | null;
  last_modified_at?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AdminNotification {
  id: string;
  admin_id?: string | null;
  superadmin_id?: string | null;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action_required: boolean;
  action_url?: string | null;
  action_data?: Record<string, any> | null;
  is_read: boolean;
  read_at?: string | null;
  is_dismissed: boolean;
  dismissed_at?: string | null;
  expires_at?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSearchFilters {
  query?: string | null;
  status?: AdminStatus | null;
  department?: string | null;
  admin_level?: number | null;
  supervisor_id?: string | null;
  has_two_factor?: boolean | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

export interface AuditLogSearchFilters {
  admin_id?: string | null;
  action_type?: string | null;
  resource_type?: string | null;
  status?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

export interface AdminListResponse {
  items: AdminProfile[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AuditLogListResponse {
  items: AdminAuditLog[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}