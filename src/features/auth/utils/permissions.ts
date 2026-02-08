import type { UserRole } from '@prisma/client';

/**
 * Available permissions in the system
 */
export const Permission = {
  // Declaration permissions
  DECLARATION_CREATE: 'declaration:create',
  DECLARATION_READ: 'declaration:read',
  DECLARATION_UPDATE: 'declaration:update',
  DECLARATION_DELETE: 'declaration:delete',
  DECLARATION_SUBMIT: 'declaration:submit',
  DECLARATION_APPROVE: 'declaration:approve',

  // Document permissions
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_DELETE: 'document:delete',

  // User management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Organization management
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',

  // Reference data
  REFERENCE_READ: 'reference:read',
  REFERENCE_CREATE: 'reference:create',
  REFERENCE_UPDATE: 'reference:update',
  REFERENCE_DELETE: 'reference:delete',

  // System settings
  SYSTEM_SETTINGS: 'system:settings',
  AUDIT_LOG_READ: 'audit:read',
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];

/**
 * Role to permissions mapping
 */
const rolePermissions: Record<UserRole, PermissionType[]> = {
  ADMIN: [
    // All permissions
    Permission.DECLARATION_CREATE,
    Permission.DECLARATION_READ,
    Permission.DECLARATION_UPDATE,
    Permission.DECLARATION_DELETE,
    Permission.DECLARATION_SUBMIT,
    Permission.DECLARATION_APPROVE,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_DELETE,
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_UPDATE,
    Permission.REFERENCE_READ,
    Permission.REFERENCE_CREATE,
    Permission.REFERENCE_UPDATE,
    Permission.REFERENCE_DELETE,
    Permission.SYSTEM_SETTINGS,
    Permission.AUDIT_LOG_READ,
  ],

  MANAGER: [
    // Declaration management
    Permission.DECLARATION_CREATE,
    Permission.DECLARATION_READ,
    Permission.DECLARATION_UPDATE,
    Permission.DECLARATION_DELETE,
    Permission.DECLARATION_SUBMIT,
    Permission.DECLARATION_APPROVE,
    // Documents
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_DELETE,
    // Users (limited)
    Permission.USER_READ,
    // Organization
    Permission.ORGANIZATION_READ,
    // References
    Permission.REFERENCE_READ,
    // Audit
    Permission.AUDIT_LOG_READ,
  ],

  DECLARANT: [
    // Declaration (own only in practice)
    Permission.DECLARATION_CREATE,
    Permission.DECLARATION_READ,
    Permission.DECLARATION_UPDATE,
    Permission.DECLARATION_SUBMIT,
    // Documents
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_READ,
    // References
    Permission.REFERENCE_READ,
    // Organization
    Permission.ORGANIZATION_READ,
  ],

  VIEWER: [
    // Read-only access
    Permission.DECLARATION_READ,
    Permission.DOCUMENT_READ,
    Permission.REFERENCE_READ,
    Permission.ORGANIZATION_READ,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | string, permission: PermissionType): boolean {
  const permissions = rolePermissions[role as UserRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole | string,
  permissions: PermissionType[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole | string, permissions: PermissionType[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole | string): PermissionType[] {
  return rolePermissions[role as UserRole] || [];
}

/**
 * Role hierarchy (higher index = more permissions)
 */
const roleHierarchy: UserRole[] = ['VIEWER', 'DECLARANT', 'MANAGER', 'ADMIN'];

/**
 * Check if role1 has higher or equal privilege than role2
 */
export function isRoleHigherOrEqual(role1: UserRole | string, role2: UserRole | string): boolean {
  const index1 = roleHierarchy.indexOf(role1 as UserRole);
  const index2 = roleHierarchy.indexOf(role2 as UserRole);
  if (index1 === -1 || index2 === -1) return false;
  return index1 >= index2;
}

/**
 * Get role display name in Russian
 */
export function getRoleDisplayName(role: UserRole | string): string {
  const names: Record<UserRole, string> = {
    ADMIN: 'Администратор',
    MANAGER: 'Менеджер',
    DECLARANT: 'Декларант',
    VIEWER: 'Просмотр',
  };
  return names[role as UserRole] || role;
}

/**
 * Get all available roles
 */
export function getAllRoles(): { value: UserRole; label: string }[] {
  return roleHierarchy.map((role) => ({
    value: role,
    label: getRoleDisplayName(role),
  }));
}
