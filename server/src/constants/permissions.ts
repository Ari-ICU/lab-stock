/**
 * Enterprise Role-Based Access Control (RBAC) Constants & Engine
 * Provides strongly-typed permission tokens, hierarchical roles, and wildcard evaluation.
 */

export const Permission = {
  // --- Inventory & Consumables ---
  STOCK_READ: 'stock:read',
  STOCK_CREATE: 'stock:create',
  STOCK_UPDATE: 'stock:update',
  STOCK_DELETE: 'stock:delete',

  // --- Hardware Equipment & Assets ---
  ASSET_READ: 'assets:read',
  ASSET_CREATE: 'assets:create',
  ASSET_UPDATE: 'assets:update',
  ASSET_DELETE: 'assets:delete',

  // --- Device Loans & Relocations ---
  LOAN_READ: 'loans:read',
  LOAN_CHECKOUT: 'loans:checkout',
  LOAN_RETURN: 'loans:return',
  LOAN_MANAGE: 'loans:manage',

  // --- Equipment Maintenance ---
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_UPDATE: 'maintenance:update',

  // --- Laboratory Locations ---
  LOCATION_READ: 'locations:read',
  LOCATION_MANAGE: 'locations:manage',

  // --- User & Administrative Management ---
  USER_READ: 'users:read',
  USER_MANAGE: 'users:manage',
  SYSTEM_ADMIN: 'system:admin',

  // Universal wildcard
  WILDCARD: '*',
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission] | string;

export const Role = {
  ADMIN: 'Primary Lab Administrator',
  LECTURER: 'Faculty Lecturer',
  ASSISTANT: 'Lab Assistant',
} as const;

export type RoleType = (typeof Role)[keyof typeof Role] | string;

/**
 * Default permission matrix mapped to institutional roles
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionType[]> = {
  [Role.ADMIN]: [Permission.WILDCARD, 'ALL'],
  'Admin': [Permission.WILDCARD, 'ALL'],
  [Role.LECTURER]: [
    Permission.STOCK_READ,
    Permission.STOCK_CREATE,
    Permission.STOCK_UPDATE,
    Permission.STOCK_DELETE,
    Permission.ASSET_READ,
    Permission.ASSET_CREATE,
    Permission.ASSET_UPDATE,
    Permission.ASSET_DELETE,
    Permission.LOAN_READ,
    Permission.LOAN_CHECKOUT,
    Permission.LOAN_RETURN,
    Permission.LOAN_MANAGE,
    Permission.MAINTENANCE_READ,
    Permission.MAINTENANCE_UPDATE,
    Permission.LOCATION_READ,
    Permission.LOCATION_MANAGE,
  ],
  'Lecturer': [
    Permission.STOCK_READ,
    Permission.STOCK_CREATE,
    Permission.STOCK_UPDATE,
    Permission.STOCK_DELETE,
    Permission.ASSET_READ,
    Permission.ASSET_CREATE,
    Permission.ASSET_UPDATE,
    Permission.ASSET_DELETE,
    Permission.LOAN_READ,
    Permission.LOAN_CHECKOUT,
    Permission.LOAN_RETURN,
    Permission.LOAN_MANAGE,
    Permission.MAINTENANCE_READ,
    Permission.MAINTENANCE_UPDATE,
    Permission.LOCATION_READ,
    Permission.LOCATION_MANAGE,
  ],
  [Role.ASSISTANT]: [
    Permission.STOCK_READ,
    Permission.STOCK_CREATE,
    Permission.STOCK_UPDATE,
    Permission.STOCK_DELETE,
    Permission.ASSET_READ,
    Permission.ASSET_CREATE,
    Permission.ASSET_UPDATE,
    Permission.ASSET_DELETE,
    Permission.LOAN_READ,
    Permission.LOAN_CHECKOUT,
    Permission.LOAN_RETURN,
    Permission.LOAN_MANAGE,
    Permission.MAINTENANCE_READ,
    Permission.MAINTENANCE_UPDATE,
    Permission.LOCATION_READ,
  ],
  'Assistant': [
    Permission.STOCK_READ,
    Permission.STOCK_CREATE,
    Permission.STOCK_UPDATE,
    Permission.STOCK_DELETE,
    Permission.ASSET_READ,
    Permission.ASSET_CREATE,
    Permission.ASSET_UPDATE,
    Permission.ASSET_DELETE,
    Permission.LOAN_READ,
    Permission.LOAN_CHECKOUT,
    Permission.LOAN_RETURN,
    Permission.LOAN_MANAGE,
    Permission.MAINTENANCE_READ,
    Permission.MAINTENANCE_UPDATE,
    Permission.LOCATION_READ,
  ],
};

/**
 * Pure evaluation function: Checks if granted permissions satisfy the required permission.
 * Supports:
 * - Direct match ('stock:create' === 'stock:create')
 * - Global wildcards ('*' or 'ALL')
 * - Resource wildcards ('stock:*' satisfies 'stock:read', 'stock:create', etc.)
 */
export function hasPermission(grantedPermissions: string[], required: string): boolean {
  if (!grantedPermissions || grantedPermissions.length === 0) {
    return false;
  }

  const normalizedRequired = required.trim().toLowerCase();

  return grantedPermissions.some((granted) => {
    const normalizedGranted = granted.trim().toLowerCase();

    // Global superuser wildcard
    if (normalizedGranted === '*' || normalizedGranted === 'all' || normalizedGranted === 'system:admin') {
      return true;
    }

    // Exact match
    if (normalizedGranted === normalizedRequired) {
      return true;
    }

    // Resource prefix wildcard (e.g. 'stock:*' satisfies 'stock:read')
    if (normalizedGranted.endsWith(':*')) {
      const prefix = normalizedGranted.slice(0, -2);
      return normalizedRequired.startsWith(`${prefix}:`);
    }

    return false;
  });
}

/**
 * Returns any permissions from `required` that are NOT satisfied by `grantedPermissions`.
 */
export function getMissingPermissions(grantedPermissions: string[], required: string[]): string[] {
  return required.filter((req) => !hasPermission(grantedPermissions, req));
}

