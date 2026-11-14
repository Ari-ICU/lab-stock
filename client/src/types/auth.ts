export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleBadge: string;
  avatarText: string;
  permissions: string;
  department: string;
  assignedLabs: string[]; // ['all'] or specific room codes
  supervisedBy?: string;
}

export type RoleBadge = 'Admin' | 'Lecturer';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleBadge: RoleBadge;
  avatarText: string;
  permissions: string;
  department: string;
  status: 'active' | 'offline' | 'suspended';
  lastLogin: string;
  assignedLabs: string[]; // ['all'] or specific room codes
  supervisedBy?: string;
}

/**
 * Checks whether a user has administrative or assigned authority over a given laboratory location.
 */
const escapeLocationRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function canUserManageLocation(
  user: User | ManagedUser | null | undefined,
  locationStr?: string
): boolean {
  if (!user) return false;

  const roleLower = (user.role || '').trim().toLowerCase();
  const badgeLower = (user.roleBadge || '').trim().toLowerCase();
  if (badgeLower === 'admin' || roleLower === 'administrator' || roleLower === 'admin') {
    return true;
  }

  const assignedLabs = Array.isArray(user.assignedLabs) ? user.assignedLabs : [];
  if (
    assignedLabs.some((lab) => {
      const normalized = lab.trim().toLowerCase();
      return normalized === 'all' || normalized === '*';
    })
  ) {
    return true;
  }

  if (assignedLabs.length === 0) return false;
  if (!locationStr || !locationStr.trim()) return false;

  const normalizedTarget = locationStr.trim().toLowerCase().replace(/\s+/g, ' ');

  return assignedLabs.some((assigned) => {
    const normAssigned = assigned.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!normAssigned) return false;
    if (normAssigned === normalizedTarget) return true;
    const regex = new RegExp(
      `(?:^|[^a-z0-9])${escapeLocationRegex(normAssigned)}(?:$|[^a-z0-9])`,
      'i'
    );
    return regex.test(normalizedTarget);
  });
}

export interface SessionDevice {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'terminal';
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface RoleDefinition {
  role: string;
  badge: RoleBadge;
  permissions: string;
  description: string;
}

