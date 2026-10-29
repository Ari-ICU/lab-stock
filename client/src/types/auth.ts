export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleBadge: string;
  avatarText: string;
  permissions: string;
  department: string;
  assignedLabs: string[]; // ['all'] or specific room codes e.g. ['Room 102B', 'Room 206']
}

export interface DemoAccount {
  name: string;
  email: string;
  role: string;
  roleBadge: string;
  password: string;
  avatarText: string;
  permissions: string;
  department: string;
  description: string;
  assignedLabs: string[]; // ['all'] or specific room codes
}

export type RoleBadge = 'Admin' | 'Lecturer' | 'Lab Assistant';

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
}

/**
 * Checks whether a user has administrative or assigned authority over a given laboratory location.
 */
export function canUserManageLocation(
  user: User | ManagedUser | DemoAccount | null | undefined,
  locationStr: string
): boolean {
  if (!user) return false;
  // Super Admins have universal authority over all labs
  if (
    user.role === 'Primary Lab Administrator' ||
    user.roleBadge === 'Admin' ||
    user.assignedLabs?.includes('all') ||
    user.assignedLabs?.includes('*')
  ) {
    return true;
  }

  if (!user.assignedLabs || user.assignedLabs.length === 0) {
    return false;
  }

  const target = locationStr.toLowerCase();
  return user.assignedLabs.some((assigned) => {
    const a = assigned.toLowerCase().trim();
    if (a === 'all' || a === '*') return true;
    const normA = a.replace(/^(rm|room)\s*/i, '').trim();
    return (
      target.includes(a) ||
      target.includes(a.replace(/^rm\s*/i, 'room ')) ||
      target.includes(a.replace(/^room\s*/i, 'rm ')) ||
      (normA.length > 0 && target.includes(normA))
    );
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

