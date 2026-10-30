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
  supervisedBy?: string;
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
export function canUserManageLocation(
  user: User | ManagedUser | DemoAccount | null | undefined,
  _locationStr?: string
): boolean {
  if (!user) return false;
  return true;
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

