'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  DemoAccount,
  ManagedUser,
  SessionDevice,
  RoleDefinition,
  RoleBadge,
  canUserManageLocation,
} from '@/types';
import { authService } from '@/services';

export type {
  User,
  DemoAccount,
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
  'Lab Assistant': {
    role: 'Lab Assistant',
    badge: 'Lab Assistant',
    permissions: 'Inventory Check-in/Out & Equipment Prep',
    description: 'Hardware setup, student lab check-in, and inventory maintenance logging',
  },
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Dr. Heng Sovannarith',
    email: 'heng.sovannarith@rupp.edu.kh',
    password: 'password123',
    role: 'Primary Lab Administrator',
    roleBadge: 'Admin',
    avatarText: 'HS',
    permissions: 'Full Read/Write Access & System Config',
    department: 'Engineering Block A - Room 102B',
    description: 'Faculty supervisor and laboratory director with full administrative oversight across all lab rooms',
    assignedLabs: ['all'],
  },
  {
    name: 'Thoeurn Ratha',
    email: 'thoeurn.ratha@rupp.edu.kh',
    password: 'password123',
    role: 'Faculty Lecturer',
    roleBadge: 'Lecturer',
    avatarText: 'TR',
    permissions: 'Course Hardware Allocation & Catalog View',
    department: 'Software Engineering Department',
    description: 'Course lecturer managing student lab stations in Room 102B & Room 206',
    assignedLabs: ['Room 102B', 'Room 206'],
  },
  {
    name: 'Chan Vicheka',
    email: 'chan.vicheka@rupp.edu.kh',
    password: 'password123',
    role: 'Lab Assistant',
    roleBadge: 'Lab Assistant',
    avatarText: 'CV',
    permissions: 'Inventory Check-in/Out & Equipment Prep',
    department: 'Hardware Depot & Lab 102B',
    description: 'Lab assistant managing equipment distribution under Faculty Lecturer supervision',
    assignedLabs: ['Room 102B', 'Room 206'],
  },
  {
    name: 'John Doe',
    email: 'john.doe@rupp.edu.kh',
    password: 'password123',
    role: 'Primary Lab Administrator',
    roleBadge: 'Admin',
    avatarText: 'JD',
    permissions: 'Full Read/Write Access & System Config',
    department: 'Faculty of Engineering',
    description: 'Engineering systems administrator',
    assignedLabs: ['all'],
  },
];

export const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: 'user-director',
    name: 'Dr. Heng Sovannarith',
    email: 'heng.sovannarith@rupp.edu.kh',
    role: 'Primary Lab Administrator',
    roleBadge: 'Admin',
    avatarText: 'HS',
    permissions: 'Full Read/Write Access & System Config',
    department: 'Engineering Block A - Room 102B',
    status: 'active',
    lastLogin: 'Today, 08:30 AM',
    assignedLabs: ['all'],
  },
  {
    id: 'user-assistant-vicheka',
    name: 'Chan Vicheka',
    email: 'chan.vicheka@rupp.edu.kh',
    role: 'Lab Assistant',
    roleBadge: 'Lab Assistant',
    avatarText: 'CV',
    permissions: 'Inventory Check-in/Out & Equipment Prep',
    department: 'Hardware Depot & Lab 102B',
    status: 'active',
    lastLogin: 'Today, 09:15 AM',
    assignedLabs: ['Room 102B', 'Room 206'],
    supervisedBy: 'Thoeurn Ratha (Faculty Lecturer)',
  },
  {
    id: 'user-lecturer',
    name: 'Thoeurn Ratha',
    email: 'thoeurn.ratha@rupp.edu.kh',
    role: 'Faculty Lecturer',
    roleBadge: 'Lecturer',
    avatarText: 'TR',
    permissions: 'Course Hardware Allocation & Catalog View',
    department: 'Software Engineering Department',
    status: 'active',
    lastLogin: 'Active now',
    assignedLabs: ['Room 102B', 'Room 206'],
  },
  {
    id: 'user-admin-john',
    name: 'John Doe',
    email: 'john.doe@rupp.edu.kh',
    role: 'Primary Lab Administrator',
    roleBadge: 'Admin',
    avatarText: 'JD',
    permissions: 'Full Read/Write Access & System Config',
    department: 'Faculty of Engineering',
    status: 'active',
    lastLogin: 'Yesterday, 04:45 PM',
    assignedLabs: ['all'],
  },
];

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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchAccount: (account: DemoAccount) => void;
  // User & Role Management
  managedUsers: ManagedUser[];
  updateUserRole: (userId: string, newRole: string) => void;
  updateUserAssignedLabs: (userId: string, assignedLabs: string[]) => void;
  addUser: (newUser: Omit<ManagedUser, 'id' | 'lastLogin'>) => void;
  deleteUser: (userId: string) => boolean;
  resetUsersToDefault: () => void;
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

export function sanitizeUser<T extends User | ManagedUser>(u: T): T {
  let role = u.role;
  let roleBadge = u.roleBadge;
  let permissions = u.permissions;
  let department = u.department;
  let assignedLabs = u.assignedLabs;
  let supervisedBy = (u as { supervisedBy?: string }).supervisedBy;

  if (assignedLabs && Array.isArray(assignedLabs)) {
    assignedLabs = assignedLabs.map((r) => (typeof r === 'string' ? r.replace(/^Rm\s+/i, 'Room ') : r));
  }

  // Enforce canonical institutional identities to heal corrupted localStorage
  const emailLower = (u.email || '').toLowerCase();
  if (
    emailLower === 'heng.sovannarith@rupp.edu.kh' ||
    emailLower === 'sovannarith@lab.edu' ||
    u.name?.includes('Sovannarith')
  ) {
    role = 'Primary Lab Administrator';
    roleBadge = 'Admin';
    permissions = 'Full Read/Write Access & System Config';
    assignedLabs = ['all'];
    department = 'Engineering Block A - Room 102B';
    supervisedBy = undefined;
  } else if (
    emailLower === 'thoeurn.ratha@rupp.edu.kh' ||
    emailLower === 'admin@lab.edu' ||
    emailLower.includes('ratha') ||
    u.name?.includes('Ratha')
  ) {
    role = 'Faculty Lecturer';
    roleBadge = 'Lecturer';
    permissions = 'Course Hardware Allocation & Catalog View';
    if (!assignedLabs || assignedLabs.length === 0 || assignedLabs.includes('all') || assignedLabs.includes('Room 305')) {
      assignedLabs = ['Room 102B', 'Room 206'];
    }
    department = 'Engineering Block A - Room 102B & Room 206';
    supervisedBy = undefined;
  } else if (
    emailLower === 'chan.vicheka@rupp.edu.kh' ||
    emailLower === 'assistant@lab.edu' ||
    emailLower === 'vakhim@lab.edu' ||
    emailLower.includes('vicheka') ||
    u.name?.includes('Vicheka') ||
    u.name?.includes('Vakhim')
  ) {
    role = 'Lab Assistant';
    roleBadge = 'Lab Assistant';
    permissions = 'Inventory Check-in/Out & Equipment Prep';
    if (!assignedLabs || assignedLabs.length === 0 || assignedLabs.includes('all')) {
      assignedLabs = ['Room 102B', 'Room 206'];
    }
    department = 'Hardware Depot & Lab 102B';
    supervisedBy = 'Thoeurn Ratha (Faculty Lecturer)';
  } else if (
    emailLower === 'john.doe@rupp.edu.kh' ||
    emailLower === 'john.doe@lab.edu' ||
    u.name?.includes('John Doe')
  ) {
    role = 'Primary Lab Administrator';
    roleBadge = 'Admin';
    permissions = 'Full Read/Write Access & System Config';
    assignedLabs = ['all'];
    department = 'Faculty of Engineering';
    supervisedBy = undefined;
  } else {
    // Custom registered user
    if (role === 'Primary Lab Administrator') {
      roleBadge = 'Admin';
      assignedLabs = ['all'];
      supervisedBy = undefined;
    } else if (role === 'Faculty Lecturer') {
      roleBadge = 'Lecturer';
      if (!assignedLabs || assignedLabs.length === 0 || assignedLabs.includes('all')) {
        assignedLabs = ['Room 102B'];
      }
      supervisedBy = undefined;
    } else {
      role = 'Lab Assistant';
      roleBadge = 'Lab Assistant';
      if (!assignedLabs || assignedLabs.length === 0 || assignedLabs.includes('all')) {
        assignedLabs = ['Room 102B'];
      }
    }
  }

  const sanitized: T = {
    ...u,
    role,
    roleBadge,
    permissions,
    department,
    assignedLabs,
  };

  if (supervisedBy !== undefined) {
    (sanitized as { supervisedBy?: string }).supervisedBy = supervisedBy;
  } else {
    delete (sanitized as { supervisedBy?: string }).supervisedBy;
  }

  return sanitized;
}

const getDefaultUser = (): User => ({
  id: 'user-admin',
  name: DEMO_ACCOUNTS[0].name,
  email: DEMO_ACCOUNTS[0].email,
  role: DEMO_ACCOUNTS[0].role,
  roleBadge: DEMO_ACCOUNTS[0].roleBadge,
  avatarText: DEMO_ACCOUNTS[0].avatarText,
  permissions: DEMO_ACCOUNTS[0].permissions,
  department: DEMO_ACCOUNTS[0].department,
  assignedLabs: DEMO_ACCOUNTS[0].assignedLabs,
});

const getInitialUser = (): User | null => {
  if (typeof window === 'undefined') {
    return getDefaultUser();
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('netlab_auth_user');
    if (stored) {
      const parsed: User = JSON.parse(stored);
      const sanitized = sanitizeUser(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      return sanitized;
    }
    const defaultUser = getDefaultUser();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  } catch {
    return getDefaultUser();
  }
};

const getStoredUsers = (): ManagedUser[] => {
  if (typeof window === 'undefined') return INITIAL_MANAGED_USERS;
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem('netlab_managed_users');
    if (stored) {
      const parsed: ManagedUser[] = JSON.parse(stored);
      return parsed.map((u) => {
        const migrated = {
          ...u,
          email: u.email.replace('@netlab.edu', '@lab.edu'),
        };
        return sanitizeUser(migrated);
      });
    }
  } catch {
    // fallback
  }
  return INITIAL_MANAGED_USERS;
};

const getStoredSessions = (): SessionDevice[] => {
  if (typeof window === 'undefined') return getInitialSessions();
  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY) || localStorage.getItem('netlab_session_devices');
    if (stored) {
      const parsed: SessionDevice[] = JSON.parse(stored);
      // Remove legacy mock session devices
      const clean = parsed.filter(
        (s) => s.id !== 'sess-rack-console' && s.id !== 'sess-tablet-scanner' && s.id !== 'sess-faculty-pc'
      );
      const current = detectCurrentDevice();
      if (clean.length > 0) {
        return clean.map((s) =>
          s.isCurrent
            ? {
                ...s,
                browser: current.browser,
                os: current.os,
                deviceName: current.deviceName,
                deviceType: current.deviceType,
                ip: current.ip,
                location: current.location,
              }
            : s
        );
      }
    }
  } catch {
    // fallback
  }
  return getInitialSessions();
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Initialize with deterministic SSR defaults to prevent hydration mismatch
  const [user, setUser] = useState<User | null>(getDefaultUser);
  const [isLoading, setIsLoading] = useState(false);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(INITIAL_MANAGED_USERS);
  const [sessionDevices, setSessionDevices] = useState<SessionDevice[]>(getInitialSessions);

  const refreshUsersFromBackend = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lab_auth_token') : null;
      if (!token) return;

      const res = await authService.getUsers();
      if (res?.users && Array.isArray(res.users) && res.users.length > 0) {
        const dbUsers: ManagedUser[] = res.users.map((dbUser: any) => {
          const roleBadge: RoleBadge =
            dbUser.is_admin || dbUser.role === 'Primary Lab Administrator'
              ? 'Admin'
              : dbUser.role === 'Lab Assistant'
              ? 'Lab Assistant'
              : 'Lecturer';

          const avatarText = (dbUser.name || 'User')
            .split(' ')
            .filter(Boolean)
            .map((p: string) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return {
            id: String(dbUser.id),
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            roleBadge,
            avatarText,
            permissions:
              roleBadge === 'Admin'
                ? 'Full Read/Write Access & System Config'
                : roleBadge === 'Lecturer'
                ? 'Course Hardware Allocation & Catalog View'
                : 'Inventory Check-in/Out & Equipment Prep',
            department: dbUser.department || 'Engineering Department',
            status: 'active',
            lastLogin: dbUser.email === 'admin@lab.edu' ? 'Active now' : 'Today, 09:00 AM',
            assignedLabs:
              dbUser.assigned_labs && dbUser.assigned_labs.length > 0
                ? dbUser.assigned_labs
                : roleBadge === 'Admin'
                ? ['all']
                : ['Room 102B'],
            supervisedBy:
              roleBadge === 'Lab Assistant' ? 'Thoeurn Ratha (Faculty Lecturer)' : undefined,
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

  // Sync state from localStorage on mount (client-only)
  useEffect(() => {
    // 1. Sync User
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('netlab_auth_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const sanitized = sanitizeUser(parsed);
        setUser(sanitized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      }

      // Auto-acquire JWT token from backend for active account if not already cached
      const existingToken = localStorage.getItem('lab_auth_token');
      const userToAuth = storedUser ? JSON.parse(storedUser) : getDefaultUser();
      if (!existingToken && userToAuth?.email) {
        authService
          .login({ email: userToAuth.email, password: 'password123' })
          .then((res) => {
            if (res?.token) {
              localStorage.setItem('lab_auth_token', res.token);
              window.dispatchEvent(new CustomEvent('csd-auth-token-ready'));
            }
          })
          .catch(() => {});
      } else if (existingToken) {
        refreshUsersFromBackend();
      }
    } catch {
      // ignore
    }

    // 2. Sync Managed Users
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem('netlab_managed_users');
      if (storedUsers) {
        const parsed: ManagedUser[] = JSON.parse(storedUsers);
        const olderDemoNames = ['Sokha Chan', 'Kimleng Heng', 'Dara Kim', 'Leang Vakhim'];
        let updated = parsed
          .filter((u) => !olderDemoNames.includes(u.name) && !u.email.includes('vakhim'))
          .map((u) => {
            const migrated = { ...u, email: u.email.replace('@netlab.edu', '@lab.edu') };
            return sanitizeUser(migrated);
          });

        INITIAL_MANAGED_USERS.forEach((initUser) => {
          if (!updated.some((u) => u.email === initUser.email)) {
            updated.push(initUser);
          }
        });

        const finalUsers = updated.map(sanitizeUser);
        setManagedUsers(finalUsers);
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(finalUsers));
        } catch {
          // ignore
        }
      } else {
        setManagedUsers(INITIAL_MANAGED_USERS);
      }
    } catch {
      // ignore
    }

    refreshUsersFromBackend();

    const handleAuthTokenReady = () => {
      refreshUsersFromBackend();
    };
    window.addEventListener('csd-auth-token-ready', handleAuthTokenReady);

    // 3. Sync Sessions & Detect Real Hardware/Browser (NO FAKE MOCK SESSIONS)
    const current = detectCurrentDevice();
    let initialList: SessionDevice[] = [];
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY) || localStorage.getItem('netlab_session_devices');
      if (storedSessions) {
        const parsed: SessionDevice[] = JSON.parse(storedSessions);
        // Remove legacy mock sessions
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

    setSessionDevices(initialList);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(initialList));
    } catch {
      // ignore
    }

    // Attempt live public IP detection asynchronously if available (cached in session)
    const detectRealIp = async () => {
      try {
        const cachedIp = typeof window !== 'undefined' ? sessionStorage.getItem('csd_client_ip') : null;
        if (cachedIp) {
          const host = window.location.hostname || 'localhost';
          const port = window.location.port ? `:${window.location.port}` : '';
          const realIpText = `${cachedIp} (${host}${port})`;
          setSessionDevices((prev) => prev.map((s) => (s.isCurrent ? { ...s, ip: realIpText } : s)));
          return;
        }

        const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1200) });
        if (res.ok) {
          const data = await res.json();
          if (data?.ip) {
            sessionStorage.setItem('csd_client_ip', data.ip);
            const host = window.location.hostname || 'localhost';
            const port = window.location.port ? `:${window.location.port}` : '';
            const realIpText = `${data.ip} (${host}${port})`;
            setSessionDevices((prev) => {
              const updated = prev.map((s) => (s.isCurrent ? { ...s, ip: realIpText } : s));
              try {
                localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }
      } catch {
        // Keeps local IP fallback (e.g. 127.0.0.1) without blocking
      }
    };
    detectRealIp();

    return () => {
      window.removeEventListener('csd-auth-token-ready', handleAuthTokenReady);
    };
  }, []);

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
      user.roleBadge === 'Admin' ||
      user.assignedLabs?.includes('all')
    );
  };

  const updateUserRole = (userId: string, newRole: string) => {
    if (!isCurrentUserAdmin()) {
      return;
    }
    const roleDef = ROLE_DEFINITIONS[newRole] || {
      role: newRole,
      badge: 'Lab Assistant' as RoleBadge,
      permissions: 'Standard Laboratory Access',
      description: 'Standard laboratory user',
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
    const isLecturer = user?.roleBadge === 'Lecturer' || user?.role === 'Faculty Lecturer';

    // RBAC Check:
    // 1. Super Admins can assign any room scope (including 'all').
    // 2. Faculty Lecturers can relocate Lab Assistants between rooms that the lecturer supervises.
    if (!isAdmin) {
      if (!isLecturer || (targetUser.roleBadge !== 'Lab Assistant' && targetUser.role !== 'Lab Assistant')) {
        return;
      }
      if (assignedLabs.includes('all') || assignedLabs.includes('*')) {
        return;
      }
      const lecturerRooms = user?.assignedLabs || [];
      // MAKE SURE ONLY: Assistant must currently be stationed in one of the lecturer's managed laboratories
      const currentAssistantLabs = targetUser.assignedLabs || [];
      const isSupervisedByLecturer = currentAssistantLabs.some((r) => lecturerRooms.includes(r));
      if (!isSupervisedByLecturer) {
        return;
      }

      // New target rooms must also be strictly within the lecturer's managed laboratories
      const hasUnauthorizedRoom = assignedLabs.some((r) => !lecturerRooms.includes(r));
      if (hasUnauthorizedRoom) {
        return;
      }
    }

    const deptString = assignedLabs.includes('all')
      ? 'Faculty Fleet Administration (All Labs)'
      : `Engineering Block A - ${assignedLabs.join(', ')}`;

    const updated = managedUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          assignedLabs,
          department: deptString,
        };
      }
      return u;
    });
    saveUsers(updated);
    authService.updateUserAssignedLabs(userId, assignedLabs).catch(() => {});

    // If updated user is the currently logged in user, update active session state
    if (user && (user.id === userId || user.email === targetUser.email)) {
      const updatedCurrentUser: User = {
        ...user,
        assignedLabs,
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

  const addUser = (newUser: Omit<ManagedUser, 'id' | 'lastLogin'>) => {
    const isAdmin = isCurrentUserAdmin();
    const isLecturer = user?.roleBadge === 'Lecturer' || user?.role === 'Faculty Lecturer';

    if (!isAdmin) {
      if (!isLecturer) return;
      // Lecturer can only provision Lab Assistants
      if (newUser.role !== 'Lab Assistant' && newUser.roleBadge !== 'Lab Assistant') {
        return;
      }
      // Lecturer cannot grant universal access
      if (newUser.assignedLabs?.includes('all') || newUser.assignedLabs?.includes('*')) {
        return;
      }
      // Lecturer can only assign rooms within their own managed laboratories
      const lecturerRooms = user?.assignedLabs || [];
      const hasUnauthorizedRoom = (newUser.assignedLabs || []).some((r) => !lecturerRooms.includes(r));
      if (hasUnauthorizedRoom) {
        return;
      }
    }

    const id = `user-${Date.now()}`;
    const userToAdd: ManagedUser = {
      ...newUser,
      id,
      lastLogin: 'Never (Invited)',
      assignedLabs: newUser.assignedLabs && newUser.assignedLabs.length > 0
        ? newUser.assignedLabs
        : (newUser.role === 'Primary Lab Administrator' ? ['all'] : ['Room 102B']),
    };
    saveUsers([...managedUsers, userToAdd]);
    authService
      .register({
        name: userToAdd.name,
        email: userToAdd.email,
        password: 'password123',
        role: userToAdd.role,
        department: userToAdd.department,
        is_admin: userToAdd.roleBadge === 'Admin',
        assigned_labs: userToAdd.assignedLabs,
      })
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

  const resetUsersToDefault = () => {
    setManagedUsers(INITIAL_MANAGED_USERS);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_MANAGED_USERS));
    } catch {
      // ignore
    }
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

    fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ip) {
          const host = window.location.hostname || 'localhost';
          const port = window.location.port ? `:${window.location.port}` : '';
          const realIpText = `${data.ip} (${host}${port})`;
          setSessionDevices((prev) => {
            const reUpdated = prev.map((s) => (s.isCurrent ? { ...s, ip: realIpText } : s));
            saveSessions(reUpdated);
            return reUpdated;
          });
        }
      })
      .catch(() => {});
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
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const emailAliases: Record<string, string> = {
      'admin@lab.edu': 'thoeurn.ratha@rupp.edu.kh',
      'ratha@lab.edu': 'thoeurn.ratha@rupp.edu.kh',
      'thoeurn.ratha@lab.edu': 'thoeurn.ratha@rupp.edu.kh',
      'sovannarith@lab.edu': 'heng.sovannarith@rupp.edu.kh',
      'assistant@lab.edu': 'chan.vicheka@rupp.edu.kh',
      'vakhim@lab.edu': 'chan.vicheka@rupp.edu.kh',
      'john.doe@lab.edu': 'john.doe@rupp.edu.kh',
    };
    const primaryEmail = emailAliases[cleanEmail] || cleanEmail;

    // 1. Attempt live backend authentication
    try {
      const res = await authService.login({ email: primaryEmail, password });
      if (res?.token && res?.user) {
        localStorage.setItem('lab_auth_token', res.token);

        const assignedRooms =
          res.user.assigned_labs && res.user.assigned_labs.length > 0
            ? res.user.assigned_labs
            : res.user.is_admin
            ? ['all']
            : ['Room 102B'];

        const initials =
          res.user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'OP';

        let badge: RoleBadge = 'Lab Assistant';
        if (res.user.is_admin || res.user.role.toLowerCase().includes('admin')) {
          badge = 'Admin';
        } else if (res.user.role.toLowerCase().includes('lecturer')) {
          badge = 'Lecturer';
        }

        const backendUser: User = {
          id: String(res.user.id),
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          roleBadge: badge,
          avatarText: initials,
          permissions: res.user.is_admin
            ? 'Full Read/Write Access & System Config'
            : 'Course Hardware Allocation & Catalog View',
          department: res.user.department || 'Engineering Block A - Room 102B',
          assignedLabs: assignedRooms,
        };

        const sanitized = sanitizeUser(backendUser);
        setUser(sanitized);
        if (rememberMe) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          } catch {
            // ignore
          }
        }
        setIsLoading(false);
        return { success: true };
      }
    } catch {
      // Backend is offline or credentials rejected, proceed to local demo fallback
    }

    // 2. Check against managed users fallback
    const matchedManaged = managedUsers.find(
      (acc) =>
        acc.email.toLowerCase() === cleanEmail ||
        acc.email.toLowerCase() === primaryEmail
    );

    if (matchedManaged) {
      if (password !== 'password123' && password !== 'admin123') {
        setIsLoading(false);
        return { success: false, error: 'Incorrect password. Demo password is: password123' };
      }

      const loggedUser: User = {
        id: matchedManaged.id,
        name: matchedManaged.name,
        email: matchedManaged.email,
        role: matchedManaged.role,
        roleBadge: matchedManaged.roleBadge,
        avatarText: matchedManaged.avatarText,
        permissions: matchedManaged.permissions,
        department: matchedManaged.department,
        assignedLabs: matchedManaged.assignedLabs || (matchedManaged.role === 'Primary Lab Administrator' ? ['all'] : ['Room 102B']),
      };

      setUser(loggedUser);
      if (rememberMe) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
      return { success: true };
    }

    // Check demo accounts
    const matchedAccount = DEMO_ACCOUNTS.find(
      (acc) =>
        acc.email.toLowerCase() === cleanEmail ||
        acc.email.toLowerCase() === primaryEmail
    );

    if (matchedAccount) {
      if (password !== matchedAccount.password && password !== 'password123' && password !== 'admin123') {
        setIsLoading(false);
        return { success: false, error: 'Incorrect password. Demo password is: password123' };
      }

      const loggedUser: User = {
        id: `user-${matchedAccount.email}`,
        name: matchedAccount.name,
        email: matchedAccount.email,
        role: matchedAccount.role,
        roleBadge: matchedAccount.roleBadge,
        avatarText: matchedAccount.avatarText,
        permissions: matchedAccount.permissions,
        department: matchedAccount.department,
        assignedLabs: matchedAccount.assignedLabs || (matchedAccount.role === 'Primary Lab Administrator' ? ['all'] : ['Room 102B']),
      };

      setUser(loggedUser);
      if (rememberMe) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
      return { success: true };
    }

    // Allow custom valid login for custom operators
    if (cleanEmail.includes('@') && password.length >= 6) {
      const initials = cleanEmail
        .split('@')[0]
        .split('.')
        .map((s) => s.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2) || 'OP';

      const customUser: User = {
        id: `user-${Date.now()}`,
        name: cleanEmail.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
        email: cleanEmail,
        role: 'Laboratory Operator',
        roleBadge: 'Operator',
        avatarText: initials,
        permissions: 'Standard Laboratory Access',
        department: 'Engineering Block A - Room 102B',
        assignedLabs: ['Room 102B'],
      };

      setUser(customUser);
      if (rememberMe) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(customUser));
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return {
      success: false,
      error: 'Invalid credentials. Please enter a valid Lab email and password (min 6 characters).',
    };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('lab_auth_token');
    } catch {
      // ignore
    }
    router.push('/login');
  };

  const switchAccount = (account: DemoAccount) => {
    const newUser: User = {
      id: `user-${account.email}`,
      name: account.name,
      email: account.email,
      role: account.role,
      roleBadge: account.roleBadge,
      avatarText: account.avatarText,
      permissions: account.permissions,
      department: account.department,
      assignedLabs: account.assignedLabs || (account.role === 'Primary Lab Administrator' ? ['all'] : ['Room 102B']),
    };
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {
      // ignore
    }

    // Acquire that account's live JWT token from backend
    authService
      .login({ email: account.email, password: account.password || 'password123' })
      .then((res) => {
        if (res?.token) {
          localStorage.setItem('lab_auth_token', res.token);
          window.dispatchEvent(new CustomEvent('csd-auth-token-ready'));
        }
      })
      .catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchAccount,
        managedUsers,
        updateUserRole,
        updateUserAssignedLabs,
        addUser,
        deleteUser,
        resetUsersToDefault,
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
