// utils/rbac.utils.ts

import { UserRole } from '@/types/enums';
import { User } from '@/types/auth.types';

// Define permissions for each role
export const RolePermissions = {
  [UserRole.CANDIDATE]: [
    'profile.view.own',
    'profile.edit.own',
    'jobs.view',
    'jobs.apply',
    'applications.view.own',
    'applications.withdraw.own',
    'messages.send',
    'messages.view.own',
  ],
  
  [UserRole.EMPLOYER]: [
    'company.view.own',
    'company.edit.own',
    'jobs.create',
    'jobs.edit.own',
    'jobs.delete.own',
    'jobs.view',
    'applications.view.company',
    'applications.update.status',
    'candidates.view.applicants',
    'messages.send',
    'messages.view.own',
  ],
  
  [UserRole.CONSULTANT]: [
    'candidates.view.all',
    'candidates.edit.assigned',
    'jobs.view.all',
    'jobs.edit.assigned',
    'applications.view.all',
    'applications.update.status',
    'applications.add.notes',
    'companies.view.all',
    'analytics.view.own',
    'messages.send',
    'messages.view.assigned',
  ],
  
  [UserRole.ADMIN]: [
    'users.view.all',
    'users.edit.all',
    'users.delete',
    'candidates.view.all',
    'candidates.edit.all',
    'companies.view.all',
    'companies.edit.all',
    'companies.verify',
    'jobs.view.all',
    'jobs.edit.all',
    'jobs.delete.all',
    'applications.view.all',
    'applications.edit.all',
    'skills.manage',
    'analytics.view.all',
    'system.configure',
    'messages.view.all',
    'audit.view',
  ],
  
  [UserRole.SUPERADMIN]: [
    '*', // All permissions
  ],
};

// Role hierarchy - higher roles inherit permissions from lower roles
export const RoleHierarchy: Record<UserRole, UserRole[]> = {
  [UserRole.CANDIDATE]: [],
  [UserRole.EMPLOYER]: [],
  [UserRole.CONSULTANT]: [],
  [UserRole.ADMIN]: [UserRole.CONSULTANT],
  [UserRole.SUPERADMIN]: [UserRole.ADMIN, UserRole.CONSULTANT, UserRole.EMPLOYER, UserRole.CANDIDATE],
};

// Check if user has specific permission
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  const userPermissions = getUserPermissions(user);
  
  // Check for wildcard permission (superadmin)
  if (userPermissions.includes('*')) return true;
  
  // Check exact permission
  if (userPermissions.includes(permission)) return true;
  
  // Check wildcard permissions (e.g., 'jobs.*' matches 'jobs.create')
  const permissionParts = permission.split('.');
  for (let i = permissionParts.length; i > 0; i--) {
    const wildcardPermission = permissionParts.slice(0, i - 1).join('.') + '.*';
    if (userPermissions.includes(wildcardPermission)) return true;
  }
  
  return false;
};

// Get all permissions for a user including inherited ones
export const getUserPermissions = (user: User): string[] => {
  const permissions = new Set<string>();
  
  // Add direct role permissions
  const rolePermissions = RolePermissions[user.role] || [];
  rolePermissions.forEach(p => permissions.add(p));
  
  // Add inherited permissions
  const inheritedRoles = RoleHierarchy[user.role] || [];
  inheritedRoles.forEach(role => {
    const inheritedPermissions = RolePermissions[role] || [];
    inheritedPermissions.forEach(p => permissions.add(p));
  });
  
  return Array.from(permissions);
};

// Check if user has any of the specified roles
export const hasRole = (user: User | null, roles: UserRole | UserRole[]): boolean => {
  if (!user) return false;
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
};

// Check if user has access to a specific resource
export const canAccessResource = (
  user: User | null,
  resource: string,
  action: string,
  ownerId?: string
): boolean => {
  if (!user) return false;
  
  // Check ownership-based permissions
  if (ownerId && ownerId === user.id) {
    return hasPermission(user, `${resource}.${action}.own`);
  }
  
  // Check general permissions
  return hasPermission(user, `${resource}.${action}`) || 
         hasPermission(user, `${resource}.${action}.all`);
};

// Role display names
export const RoleDisplayNames: Record<UserRole, string> = {
  [UserRole.CANDIDATE]: 'Candidate',
  [UserRole.EMPLOYER]: 'Employer',
  [UserRole.CONSULTANT]: 'Consultant',
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.SUPERADMIN]: 'Super Administrator',
};

// Role descriptions
export const RoleDescriptions: Record<UserRole, string> = {
  [UserRole.CANDIDATE]: 'Job seekers looking for opportunities',
  [UserRole.EMPLOYER]: 'Company representatives posting jobs',
  [UserRole.CONSULTANT]: 'Recruitment consultants managing the hiring process',
  [UserRole.ADMIN]: 'System administrators with elevated privileges',
  [UserRole.SUPERADMIN]: 'System owners with full access',
};

// Get accessible routes for a role
export const getAccessibleRoutes = (role: UserRole): string[] => {
  const routes: Record<UserRole, string[]> = {
    [UserRole.CANDIDATE]: [
      '/dashboard',
      '/profile',
      '/jobs',
      '/applications',
      '/messages',
      '/settings',
    ],
    [UserRole.EMPLOYER]: [
      '/dashboard',
      '/company',
      '/jobs/manage',
      '/jobs/create',
      '/applications/review',
      '/candidates',
      '/messages',
      '/settings',
    ],
    [UserRole.CONSULTANT]: [
      '/dashboard',
      '/candidates',
      '/companies',
      '/jobs',
      '/applications',
      '/analytics',
      '/messages',
      '/settings',
    ],
    [UserRole.ADMIN]: [
      '/dashboard',
      '/users',
      '/candidates',
      '/companies',
      '/jobs',
      '/applications',
      '/skills',
      '/analytics',
      '/messages',
      '/system',
      '/audit',
      '/settings',
    ],
    [UserRole.SUPERADMIN]: [
      '/*', // All routes
    ],
  };
  
  return routes[role] || [];
};

// Check if user can access a route
export const canAccessRoute = (user: User | null, route: string): boolean => {
  if (!user) return false;
  
  const accessibleRoutes = getAccessibleRoutes(user.role);
  
  // Check for wildcard access
  if (accessibleRoutes.includes('/*')) return true;
  
  // Check exact match or prefix match
  return accessibleRoutes.some(r => 
    route === r || route.startsWith(r + '/')
  );
};