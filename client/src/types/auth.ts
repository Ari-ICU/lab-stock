export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleBadge: string;
  avatarText: string;
  permissions: string;
  department: string;
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

