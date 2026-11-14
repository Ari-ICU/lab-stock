'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  ManagedUser,
  SessionDevice,
  RoleDefinition,
  RoleBadge,
  canUserManageLocation,
} from '@/types';
import { authService } from '@/services';
import { ApiError, getAuthToken } from '@/services/apiClient';

export type {
  User,
  ManagedUser,
  SessionDevice,
  RoleDefinition,
  RoleBadge,
};

export { canUserManageLocation };

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  'Primary Lab Administrator': {
    role: 'Primary Lab Administrator',
    badge: 'Admin',
    permissions: 'Full Read/Write Access & System Config',
    description: 'Full administrative authority over lab hardware, access control, and stock',
  },
  'Faculty Lecturer': {
    role: 'Faculty Lecturer',
    badge: 'Lecturer',
    permissions: 'Course Hardware Allocation & Catalog View',
    description: 'Course workstation allocation, teaching resource schedule, and inventory review',
  },
};

export function detectCurrentDevice(): {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'terminal';
  deviceName: string;
  ip: string;
  location: string;
} {
  if (typeof window === 'undefined') {
    return {
      browser: 'Web Browser',
      os: 'Operating System',
      deviceType: 'desktop',
      deviceName: 'Lab Workstation',
      ip: '127.0.0.1 (Localhost)',
      location: 'Local Client Session',
    };
  }

  const ua = navigator.userAgent;

  // Real Browser Detection with major version
  let browser = 'Web Browser';
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/([\d.]+)/);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (ua.includes('Chrome/')) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/([\d.]+)/);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  }

  // Real Device & OS Detection
  let os = 'Unknown OS';
  let deviceName = 'Client Workstation';
  let deviceType: 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'terminal' = 'desktop';

  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);

  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile) {
    deviceType = 'mobile';
  } else if (window.screen.width <= 1440 && window.screen.height <= 900) {
    deviceType = 'laptop';
  } else {
    deviceType = 'desktop';
  }

  if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
    let isAppleSilicon = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
          if (renderer.includes('Apple') || renderer.includes('M1') || renderer.includes('M2') || renderer.includes('M3') || renderer.includes('M4')) {
            isAppleSilicon = true;
          }
        }
      }
    } catch {
      // ignore
    }

    os = isAppleSilicon ? 'macOS (Apple Silicon)' : 'macOS';
    deviceName = isAppleSilicon
      ? (deviceType === 'laptop' ? 'Apple MacBook (Apple Silicon)' : 'Apple Mac (Apple Silicon)')
      : (deviceType === 'laptop' ? 'Apple MacBook Pro' : 'Apple Mac Workstation');
  } else if (ua.includes('Windows NT 10.0') || ua.includes('Windows')) {
    os = 'Windows 11 / 10';
    deviceName = deviceType === 'laptop' ? 'Windows Laptop PC' : 'Windows PC Workstation';
  } else if (ua.includes('Linux')) {
    os = 'Linux X11';
    deviceName = 'Linux Workstation';
  } else if (ua.includes('iPhone')) {
    os = 'iOS';
    deviceName = 'Apple iPhone';
  } else if (ua.includes('iPad')) {
    os = 'iPadOS';
    deviceName = 'Apple iPad';
  } else if (ua.includes('Android')) {
    os = 'Android';
    deviceName = 'Android Device';
  }

  // Real IP / Host detection
  const host = window.location.hostname || 'localhost';
  const port = window.location.port ? `:${window.location.port}` : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
  const ip = isLocal ? `127.0.0.1 (${host}${port})` : `${host}${port}`;

  // Real Location & Timezone
  let location = 'Local Client Session';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    const lang = (navigator.language || 'en').toUpperCase();
    const res = `${window.screen.width}×${window.screen.height}`;
    location = `${tz} • ${lang} • ${res}`;
  } catch {
    // ignore
  }

  return { browser, os, deviceType, deviceName, ip, location };
}

export function getInitialSessions(): SessionDevice[] {
  const current = detectCurrentDevice();
  return [
    {
      id: 'sess-current',
      deviceName: current.deviceName,
      deviceType: current.deviceType,
      browser: current.browser,
      os: current.os,
      ip: current.ip,
      location: current.location,
      lastActive: 'Active now',
      isCurrent: true,
    },
  ];
}

export type AuthErrorCode =
  | 'VALIDATION'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  errorCode?: AuthErrorCode;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthActionResult>;
  logout: () => void;
  // User & Role Management
  managedUsers: ManagedUser[];
  updateUserRole: (userId: string, newRole: string) => void;
  updateUserAssignedLabs: (userId: string, assignedLabs: string[]) => void;
  addUser: (newUser: Omit<ManagedUser, 'id' | 'lastLogin'> & { password?: string }) => void;
  deleteUser: (userId: string) => boolean;
  // Location Permissions Guard
  canManageLocation: (locationStr: string) => boolean;
  // Session Devices
  sessionDevices: SessionDevice[];
  refreshSessionDevices: () => void;
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
}

const STORAGE_KEY = 'lab_auth_user';
const USERS_STORAGE_KEY = 'lab_managed_users';
const SESSIONS_STORAGE_KEY = 'lab_session_devices';

const CACHE_STORAGE_KEYS = [
  STORAGE_KEY,
  'netlab_auth_user',
  'lab_auth_token',
  USERS_STORAGE_KEY,
  SESSIONS_STORAGE_KEY,
  'csd_cache_assets',
  'csd_cache_stock',
  'csd_cache_locations',
  'csd_cache_loans',
  'csd_cache_transfers',
  'csd_cache_racks',
  'csd_cache_categories',
] as const;

function clearClientSessionStorage(): void {
  try {
    if (typeof window === 'undefined') return;
    for (const key of CACHE_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    sessionStorage.removeItem('lab_auth_token');
  } catch {
    // ignore storage access errors
  }
}

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    if (typeof payload?.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function generateTemporaryPassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;
  const pick = (charset: string, byte: number) => charset[byte % charset.length];

  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    const chars = [
      pick(upper, bytes[0]),
      pick(lower, bytes[1]),
      pick(digits, bytes[2]),
      pick(symbols, bytes[3]),
    ];
    for (let i = 4; i < length; i++) {
      chars.push(pick(all, bytes[i]));
    }
    return chars.join('');
  }

  return `Tmp#${Date.now().toString(36)}A9x`;
}

export function sanitizeUser<T extends User | ManagedUser>(u: T): T {
  const roleLower = (u.role || '').trim().toLowerCase();
  const isAdminRole =
    u.roleBadge === 'Admin' ||
    u.role === 'Primary Lab Administrator' ||
    u.role === 'Department Administrator' ||
    roleLower === 'administrator' ||
    roleLower === 'admin' ||
    roleLower.includes('admin');

  const role = u.role || (isAdminRole ? 'Primary Lab Administrator' : 'Faculty Lecturer');
  const roleBadge: RoleBadge = isAdminRole ? 'Admin' : 'Lecturer';
  const permissions =
    u.permissions ||
    (isAdminRole
      ? 'Full Read/Write Access & System Config'
      : 'Course Hardware Allocation & Catalog View');
  const department = u.department || 'Engineering Department';

  const normalizedLabs = Array.isArray(u.assignedLabs)
    ? u.assignedLabs
        .map((r) => (typeof r === 'string' ? r.replace(/^Rm\s+/i, 'Room ').trim() : r))
        .filter((r): r is string => Boolean(r))
    : isAdminRole
    ? ['all']
    : [];

  const sanitized: T = {
    ...u,
    role,
    roleBadge,
    permissions,
    department,
    assignedLabs: normalizedLabs,
  };

  delete (sanitized as { supervisedBy?: string }).supervisedBy;
  return sanitized;
}

interface BackendUserRecord {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  is_admin?: boolean;
  department?: string | null;
  assigned_labs?: string[] | null;
  permissions?: string[] | null;
}

const mapBackendUserToClient = (rawUser: BackendUserRecord): User => {
  const isAdminFlag =
    Boolean(rawUser.is_admin) ||
    (typeof rawUser.role === 'string' && rawUser.role.toLowerCase().includes('admin'));

  const assignedRooms: string[] =
    Array.isArray(rawUser.assigned_labs) && rawUser.assigned_labs.length > 0
      ? rawUser.assigned_labs
      : isAdminFlag
      ? ['all']
      : [];

  const initials =
    String(rawUser.name || 'Operator')
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'OP';

  return sanitizeUser({
    id: String(rawUser.id),
    name: rawUser.name || 'Operator',
    email: rawUser.email || '',
    role: rawUser.role || (isAdminFlag ? 'Primary Lab Administrator' : 'Faculty Lecturer'),
    roleBadge: isAdminFlag ? 'Admin' : 'Lecturer',
    avatarText: initials,
    permissions: isAdminFlag
      ? 'Full Read/Write Access & System Config'
      : 'Course Hardware Allocation & Catalog View',
    department: rawUser.department || 'Engineering Block A',
    assignedLabs: assignedRooms,
  });
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [sessionDevices, setSessionDevices] = useState<SessionDevice[]>(getInitialSessions);

  const refreshUsersFromBackend = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await authService.getUsers();
      if (res?.users && Array.isArray(res.users) && res.users.length > 0) {
        const dbUsers: ManagedUser[] = (res.users as BackendUserRecord[])
          .filter(
            (dbUser) =>
              dbUser.role !== 'Lab Assistant' &&
              !dbUser.email?.includes('vicheka') &&
              !dbUser.email?.includes('assistant')
          )
          .map((dbUser) => {
            const roleStr = String(dbUser.role || '');
            const roleBadge: RoleBadge =
              dbUser.is_admin || roleStr.toLowerCase().includes('admin')
                ? 'Admin'
                : 'Lecturer';

            const avatarText = (dbUser.name || 'User')
              .split(' ')
              .filter(Boolean)
              .map((p: string) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return {
              id: String(dbUser.id ?? ''),
              name: dbUser.name || 'Operator',
              email: dbUser.email || '',
              role:
                dbUser.role ||
                (roleBadge === 'Admin' ? 'Primary Lab Administrator' : 'Faculty Lecturer'),
              roleBadge,
              avatarText,
              permissions:
                roleBadge === 'Admin'
                  ? 'Full Read/Write Access & System Config'
                  : 'Course Hardware Allocation & Catalog View',
              department: dbUser.department || 'Engineering Department',
              status: 'active',
              lastLogin: 'Verified session',
              assignedLabs:
                Array.isArray(dbUser.assigned_labs) && dbUser.assigned_labs.length > 0
                  ? dbUser.assigned_labs
                  : roleBadge === 'Admin'
                  ? ['all']
                  : [],
            };
          });

        setManagedUsers(dbUsers);
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(dbUsers));
        } catch {
          // ignore
        }
      }
    } catch {
      // Backend offline or token pending
    }
  };

  // Bootstrap authenticated session & local device telemetry on mount
  useEffect(() => {
    let isCancelled = false;

    const clearStoredSession = () => {
      clearClientSessionStorage();
    };

    const bootstrapAuth = async () => {
      const existingToken = getAuthToken();
      if (!existingToken || isJwtExpired(existingToken)) {
        clearStoredSession();
        if (!isCancelled) {
          setUser(null);
          setManagedUsers([]);
          setIsAuthInitialized(true);
        }
        return;
      }

      try {
        const profileRes = await authService.getProfile();
        if (!isCancelled && profileRes?.user) {
          const verifiedUser = mapBackendUserToClient(profileRes.user);
          setUser(verifiedUser);
          try {
            if (localStorage.getItem('lab_auth_token')) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedUser));
            }
          } catch {
            // ignore
          }
          await refreshUsersFromBackend();
          if (!isCancelled) {
            setIsAuthInitialized(true);
          }
          return;
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearStoredSession();
          if (!isCancelled) {
            setUser(null);
            setManagedUsers([]);
            setIsAuthInitialized(true);
          }
          return;
        }
      }

      // Network unreachable in development: allow cached remembered profile only alongside unexpired token
      if (process.env.NODE_ENV !== 'production' && !isJwtExpired(existingToken)) {
        try {
          const storedUser = localStorage.getItem(STORAGE_KEY);
          if (storedUser && !isCancelled) {
            setUser(sanitizeUser(JSON.parse(storedUser)));
          }
        } catch {
          // ignore
        }
      } else {
        if (!isCancelled) {
          setUser(null);
        }
      }

      if (!isCancelled) {
        setIsAuthInitialized(true);
      }
    };

    bootstrapAuth();

    const handleAuthTokenReady = () => {
      refreshUsersFromBackend();
    };
    const handleAuthExpired = () => {
      clearStoredSession();
      setUser(null);
      setManagedUsers([]);
      router.replace('/login?reason=expired');
    };

    window.addEventListener('csd-auth-token-ready', handleAuthTokenReady);
    window.addEventListener('csd-auth-expired', handleAuthExpired);

    // Sync local browser session device telemetry (no external IP lookup calls)
    const current = detectCurrentDevice();
    let initialList: SessionDevice[] = [];
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        const parsed: SessionDevice[] = JSON.parse(storedSessions);
        const clean = parsed.filter(
          (s) => s.id !== 'sess-rack-console' && s.id !== 'sess-tablet-scanner' && s.id !== 'sess-faculty-pc'
        );
        if (clean.length > 0) {
          initialList = clean.map((s) =>
            s.isCurrent
              ? {
                  ...s,
                  browser: current.browser,
                  os: current.os,
                  deviceName: current.deviceName,
                  deviceType: current.deviceType,
                  ip: current.ip,
                  location: current.location,
                  lastActive: 'Active now',
                }
              : s
          );
        }
      }
    } catch {
      // ignore
    }

    if (initialList.length === 0) {
      initialList = [
        {
          id: 'sess-current',
          deviceName: current.deviceName,
          deviceType: current.deviceType,
          browser: current.browser,
          os: current.os,
          ip: current.ip,
          location: current.location,
          lastActive: 'Active now',
          isCurrent: true,
        },
      ];
    }

    const sessionFrameId = window.requestAnimationFrame(() => {
      if (!isCancelled) {
        setSessionDevices(initialList);
      }
    });
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(initialList));
    } catch {
      // ignore
    }

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(sessionFrameId);
      window.removeEventListener('csd-auth-token-ready', handleAuthTokenReady);
      window.removeEventListener('csd-auth-expired', handleAuthExpired);
    };
  }, []);

  // Redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (!isAuthInitialized) return;
    const isLoginRoute = pathname === '/login' || pathname?.startsWith('/login/');
    if (!user && !isLoginRoute) {
      router.replace('/login');
    }
  }, [isAuthInitialized, user, pathname, router]);

  const saveUsers = (usersList: ManagedUser[]) => {
    setManagedUsers(usersList);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
    } catch {
      // ignore
    }
  };

  const saveSessions = (sessionsList: SessionDevice[]) => {
    setSessionDevices(sessionsList);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsList));
    } catch {
      // ignore
    }
  };

  const isCurrentUserAdmin = (): boolean => {
    if (!user) return false;
    return (
      user.role === 'Primary Lab Administrator' ||
      user.role === 'Department Administrator' ||
      user.role === 'Administrator' ||
      user.roleBadge === 'Admin'
    );
  };

  const updateUserRole = (userId: string, newRole: string) => {
    if (!isCurrentUserAdmin()) {
      return;
    }
    const roleDef = ROLE_DEFINITIONS[newRole] || {
      role: newRole,
      badge: 'Lecturer' as RoleBadge,
      permissions: 'Course Hardware Allocation & Catalog View',
      description: 'Standard faculty operator',
    };

    const updated = managedUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          role: roleDef.role,
          roleBadge: roleDef.badge,
          permissions: roleDef.permissions,
        };
      }
      return u;
    });

    saveUsers(updated);
    authService.updateUserRole(userId, newRole).catch(() => {});

    // If updated user is the currently logged in user, update their session
    if (user && (user.id === userId || user.email === updated.find((u) => u.id === userId)?.email)) {
      const updatedCurrentUser: User = {
        ...user,
        role: roleDef.role,
        roleBadge: roleDef.badge,
        permissions: roleDef.permissions,
      };
      setUser(updatedCurrentUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));
      } catch {
        // ignore
      }
    }
  };

  const updateUserAssignedLabs = (userId: string, assignedLabs: string[]) => {
    const targetUser = managedUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const isAdmin = isCurrentUserAdmin();
    if (!isAdmin) return;

    const finalAssignedLabs = assignedLabs;
    const deptString = finalAssignedLabs.includes('all')
      ? 'Faculty Fleet Administration (All Labs)'
      : `Engineering Block A - ${finalAssignedLabs.join(', ')}`;

    const updated = managedUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          assignedLabs: finalAssignedLabs,
          department: deptString,
        };
      }
      return u;
    });
    saveUsers(updated);
    authService.updateUserAssignedLabs(userId, finalAssignedLabs).catch(() => {});

    // If updated user is the currently logged in user, update active session state
    if (user && (user.id === userId || user.email === targetUser.email)) {
      const updatedCurrentUser: User = {
        ...user,
        assignedLabs: finalAssignedLabs,
        department: deptString,
      };
      setUser(updatedCurrentUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));
      } catch {
        // ignore
      }
    }
  };

  const canManageLocation = (locationStr: string): boolean => {
    return canUserManageLocation(user, locationStr);
  };

  const addUser = (newUser: Omit<ManagedUser, 'id' | 'lastLogin'> & { password?: string }) => {
    const isAdmin = isCurrentUserAdmin();
    if (!isAdmin) return;

    const id = `user-${Date.now()}`;
    const assignedLabs =
      newUser.assignedLabs && newUser.assignedLabs.length > 0
        ? newUser.assignedLabs
        : newUser.role === 'Primary Lab Administrator'
        ? ['all']
        : [];
    const userToAdd: ManagedUser = {
      ...newUser,
      id,
      lastLogin: 'Never (Invited)',
      assignedLabs,
    };
    saveUsers([...managedUsers, userToAdd]);
    authService
      .register({
        name: userToAdd.name,
        email: userToAdd.email,
        password: newUser.password || generateTemporaryPassword(),
        role: userToAdd.role,
        department: userToAdd.department,
        is_admin: userToAdd.roleBadge === 'Admin',
        assigned_labs: assignedLabs,
      })
      .then(() => refreshUsersFromBackend())
      .catch(() => {});
  };

  const deleteUser = (userId: string): boolean => {
    if (!isCurrentUserAdmin()) {
      return false;
    }
    // Prevent deleting the currently active user or deleting all admins
    if (user && user.id === userId) {
      return false;
    }
    const filtered = managedUsers.filter((u) => u.id !== userId);
    saveUsers(filtered);
    authService.deleteUser(userId).catch(() => {});
    return true;
  };

  const refreshSessionDevices = () => {
    const current = detectCurrentDevice();
    const updated = sessionDevices.map((s) => {
      if (s.isCurrent) {
        return {
          ...s,
          browser: current.browser,
          os: current.os,
          deviceName: current.deviceName,
          deviceType: current.deviceType,
          ip: current.ip,
          location: current.location,
          lastActive: 'Active now',
        };
      }
      return s;
    });
    saveSessions(updated);
  };

  const revokeSession = (sessionId: string) => {
    const filtered = sessionDevices.filter((s) => s.id !== sessionId);
    saveSessions(filtered);
  };

  const revokeAllOtherSessions = () => {
    const remaining = sessionDevices.filter((s) => s.isCurrent);
    saveSessions(remaining);
  };

  const login = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<AuthActionResult> => {
    setIsLoading(true);

    const primaryEmail = email.trim().toLowerCase();

    // 1. Live backend authentication
    try {
      const res = await authService.login({ email: primaryEmail, password });
      if (res?.token && res?.user) {
        if (res.user.role === 'Lab Assistant') {
          setIsLoading(false);
          return {
            success: false,
            errorCode: 'FORBIDDEN',
            error: 'Access restricted for this account role.',
          };
        }

        const clientUser = mapBackendUserToClient(res.user);
        try {
          if (rememberMe) {
            localStorage.setItem('lab_auth_token', res.token);
            sessionStorage.removeItem('lab_auth_token');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clientUser));
          } else {
            sessionStorage.setItem('lab_auth_token', res.token);
            localStorage.removeItem('lab_auth_token');
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          // ignore
        }

        setUser(clientUser);
        setIsAuthInitialized(true);
        window.dispatchEvent(new CustomEvent('csd-auth-token-ready'));
        refreshUsersFromBackend();
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return {
        success: false,
        errorCode: 'SERVER_ERROR',
        error: 'Authentication response did not include a valid session token.',
      };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setIsLoading(false);
          return {
            success: false,
            errorCode: 'INVALID_CREDENTIALS',
            error: err.message || 'Invalid email or password credentials.',
          };
        }
        if (err.status === 403) {
          setIsLoading(false);
          return {
            success: false,
            errorCode: 'FORBIDDEN',
            error: err.message || 'Access restricted for this laboratory account.',
          };
        }
        if (err.status === 429) {
          setIsLoading(false);
          return {
            success: false,
            errorCode: 'RATE_LIMITED',
            error:
              err.message ||
              'Too many sign-in attempts. Please wait a minute before trying again.',
          };
        }
        if (err.status >= 400 && err.status < 500 && err.status !== 408) {
          setIsLoading(false);
          return {
            success: false,
            errorCode: 'VALIDATION',
            error: err.message || 'Please check your email and password format.',
          };
        }
        if (err.status >= 500) {
          setIsLoading(false);
          return {
            success: false,
            errorCode: 'SERVER_ERROR',
            error: 'The authentication service is temporarily unavailable. Please try again shortly.',
          };
        }

        setIsLoading(false);
        return {
          success: false,
          errorCode: err.status === 408 ? 'TIMEOUT' : 'NETWORK_ERROR',
          error:
            err.status === 408
              ? 'The authentication server took too long to respond.'
              : 'Unable to reach the authentication server. Verify the backend gateway is online.',
        };
      }

      setIsLoading(false);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        error: 'Unable to reach the authentication server. Please try again later.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setManagedUsers([]);
    setSessionDevices([]);
    clearClientSessionStorage();
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthInitialized,
        isLoading,
        login,
        logout,
        managedUsers,
        updateUserRole,
        updateUserAssignedLabs,
        addUser,
        deleteUser,
        canManageLocation,
        sessionDevices,
        refreshSessionDevices,
        revokeSession,
        revokeAllOtherSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
