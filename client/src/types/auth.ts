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
  supervisedBy?: string;
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

  const t = locationStr.toLowerCase();
  return user.assignedLabs.some((assignedRoom) => {
    const a = assignedRoom.toLowerCase().trim();
    if (a === 'all' || a === '*') return true;
    if (a.includes('102') && !a.includes('102b') && t.includes('102b')) return false;
    if (a.includes('102b') && !t.includes('102b')) return false;
    const escaped = a.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped + '\\b', 'i');
    if (regex.test(t) || t.includes(a)) return true;
    const normA = a.replace(/^(rm|room)\s*/i, '').trim();
    if (normA.length > 0) {
      const numRegex = new RegExp('\\b' + normA + '\\b', 'i');
      return numRegex.test(t);
    }
    return false;
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

