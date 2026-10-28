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
} from '@/types';

export type {
  User,
  DemoAccount,
  ManagedUser,
  SessionDevice,
  RoleDefinition,
  RoleBadge,
};

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
    email: 'sovannarith@lab.edu',
    password: 'password123',
    role: 'Primary Lab Administrator',
    roleBadge: 'Admin',
    avatarText: 'HS',
    permissions: 'Full Read/Write Access & System Config',
    department: 'Engineering Block A - Room 102B',
    description: 'Faculty supervisor and laboratory director with full administrative oversight',
  },
  {
    name: 'Thoeurn Ratha',
    email: 'admin@lab.edu',
    password: 'password123',
    role: 'Faculty Lecturer',
    roleBadge: 'Lecturer',
    avatarText: 'TR',
    permissions: 'Course Hardware Allocation & Catalog View',
    department: 'Engineering Block A - Room 102B',
    description: 'Course lecturer managing student lab stations and curriculum hardware',
  },
  {
    name: 'Leang Vakhim',
    email: 'vakhim@lab.edu',
    password: 'password123',
    role: 'Lab Assistant',
    roleBadge: 'Lab Assistant',
    avatarText: 'LV',
    permissions: 'Inventory Check-in/Out & Equipment Prep',
    department: 'Engineering Block A - Room 102B',
    description: 'Lab assistant managing equipment distribution, inspection, and student check-ins',
  },
];

export const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: 'user-director',
    name: 'Dr. Heng Sovannarith',
    email: 'sovannarith@lab.edu',
    role: 'Primary Lab Administrator',
    roleBadge: 'Admin',
    avatarText: 'HS',
    permissions: 'Full Read/Write Access & System Config',
    department: 'Engineering Block A - Room 102B',
    status: 'active',
    lastLogin: 'Today, 08:30 AM',
  },
  {
    id: 'user-lecturer',
    name: 'Thoeurn Ratha',
    email: 'admin@lab.edu',
    role: 'Faculty Lecturer',
    roleBadge: 'Lecturer',
    avatarText: 'TR',
    permissions: 'Course Hardware Allocation & Catalog View',
    department: 'Engineering Block A - Room 102B',
    status: 'active',
    lastLogin: 'Active now',
  },
  {
    id: 'user-assistant',
    name: 'Leang Vakhim',
    email: 'vakhim@lab.edu',
    role: 'Lab Assistant',
    roleBadge: 'Lab Assistant',
    avatarText: 'LV',
    permissions: 'Inventory Check-in/Out & Equipment Prep',
    department: 'Engineering Block A - Room 102B',
    status: 'active',
    lastLogin: 'Today, 09:20 AM',
  },
];

export function detectCurrentDevice(): {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'terminal';
  deviceName: string;
} {
  if (typeof window === 'undefined') {
    return {
      browser: 'Web Browser',
      os: 'Operating System',
      deviceType: 'desktop',
      deviceName: 'Lab Workstation',
    };
  }

  const ua = navigator.userAgent;
  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Chrome')) browser = 'Chrome';

  let os = 'macOS';
  let deviceType: 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'terminal' = 'desktop';
  let deviceName = 'Engineering Workstation';

  if (ua.includes('Mac OS') || ua.includes('Macintosh')) {
    os = 'macOS Sonoma';
    deviceName = 'Apple Mac Workstation';
  } else if (ua.includes('Windows')) {
    os = 'Windows 11 Pro';
    deviceName = 'Windows PC Workstation';
  } else if (ua.includes('Linux')) {
    os = 'Ubuntu Linux 24.04';
    deviceType = 'terminal';
    deviceName = 'Linux Lab Terminal';
  } else if (ua.includes('iPad')) {
    os = 'iPadOS 17.5';
    deviceType = 'tablet';
    deviceName = 'Lab Audit iPad';
  } else if (ua.includes('iPhone')) {
    os = 'iOS 17.5';
    deviceType = 'mobile';
    deviceName = 'iPhone Scanner Handheld';
  } else if (ua.includes('Android')) {
    os = 'Android 14';
    deviceType = 'mobile';
    deviceName = 'Android Terminal Scanner';
  }

  return { browser, os, deviceType, deviceName };
}

export function getInitialSessions(): SessionDevice[] {
  return [
    {
      id: 'sess-current',
      deviceName: 'Engineering Workstation',
      deviceType: 'desktop',
      browser: 'Web Browser',
      os: 'Operating System',
      ip: '192.168.102.15',
      location: 'Room 102B - Workstation 01',
      lastActive: 'Active now',
      isCurrent: true,
    },
    {
      id: 'sess-rack-console',
      deviceName: 'Rack A Management Terminal',
      deviceType: 'terminal',
      browser: 'Chromium 122',
      os: 'Debian GNU/Linux 12',
      ip: '192.168.102.40',
      location: 'Rack Cabinet A - Console Port',
      lastActive: '12 minutes ago',
      isCurrent: false,
    },
    {
      id: 'sess-tablet-scanner',
      deviceName: 'Mobile Barcode Scanner Tablet',
      deviceType: 'tablet',
      browser: 'Mobile Safari 17.5',
      os: 'iPadOS 17.5',
      ip: '192.168.102.88',
      location: 'Room 102B Inventory Cart',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
    {
      id: 'sess-faculty-pc',
      deviceName: 'Instructor Teaching Podium',
      deviceType: 'desktop',
      browser: 'Microsoft Edge 124',
      os: 'Windows 11 Education',
      ip: '192.168.102.10',
      location: 'Room 102B Faculty Desk',
      lastActive: 'Yesterday',
      isCurrent: false,
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
  addUser: (newUser: Omit<ManagedUser, 'id' | 'lastLogin'>) => void;
  deleteUser: (userId: string) => boolean;
  // Session Devices
  sessionDevices: SessionDevice[];
  refreshSessionDevices: () => void;
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
}

const STORAGE_KEY = 'lab_auth_user';
const USERS_STORAGE_KEY = 'lab_managed_users';
const SESSIONS_STORAGE_KEY = 'lab_session_devices';

const getDefaultUser = (): User => ({
  id: 'user-admin',
  name: DEMO_ACCOUNTS[0].name,
  email: DEMO_ACCOUNTS[0].email,
  role: DEMO_ACCOUNTS[0].role,
  roleBadge: DEMO_ACCOUNTS[0].roleBadge,
  avatarText: DEMO_ACCOUNTS[0].avatarText,
  permissions: DEMO_ACCOUNTS[0].permissions,
  department: DEMO_ACCOUNTS[0].department,
});

const getInitialUser = (): User | null => {
  if (typeof window === 'undefined') {
    return getDefaultUser();
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('netlab_auth_user');
    if (stored) {
      return JSON.parse(stored);
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
      // Migrate email from @netlab.edu to @lab.edu if stored
      return parsed.map((u) => ({ ...u, email: u.email.replace('@netlab.edu', '@lab.edu') }));
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
      // Keep current device up to date
      const current = detectCurrentDevice();
      return parsed.map((s) => (s.isCurrent ? { ...s, browser: current.browser, os: current.os, deviceName: current.deviceName } : s));
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

  // Sync state from localStorage on mount (client-only)
  useEffect(() => {
    // 1. Sync User
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('netlab_auth_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore
    }

    // 2. Sync Managed Users (ensure only the 3 authorized accounts or custom registered ones)
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem('netlab_managed_users');
      if (storedUsers) {
        const parsed: ManagedUser[] = JSON.parse(storedUsers);
        const olderDemoNames = ['Sokha Chan', 'Kimleng Heng', 'Dara Kim'];
        let updated = parsed
          .filter((u) => !olderDemoNames.includes(u.name))
          .map((u) => ({ ...u, email: u.email.replace('@netlab.edu', '@lab.edu') }));

        // Ensure Dr. Heng Sovannarith is present
        if (!updated.some((u) => u.name.includes('Sovannarith') || u.email.includes('sovannarith'))) {
          updated.unshift(INITIAL_MANAGED_USERS[0]);
        }
        // Ensure Thoeurn Ratha is present
        if (!updated.some((u) => u.name.includes('Ratha') || u.email.includes('admin'))) {
          updated.splice(1, 0, INITIAL_MANAGED_USERS[1]);
        }
        // Ensure Leang Vakhim is present
        if (!updated.some((u) => u.name.includes('Vakhim') || u.email.includes('vakhim'))) {
          updated.push(INITIAL_MANAGED_USERS[2]);
        }

        setManagedUsers(updated);
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      } else {
        setManagedUsers(INITIAL_MANAGED_USERS);
      }
    } catch {
      // ignore
    }

    // 3. Sync Sessions & Detect Real Hardware/Browser
    const current = detectCurrentDevice();
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY) || localStorage.getItem('netlab_session_devices');
      if (storedSessions) {
        const parsed: SessionDevice[] = JSON.parse(storedSessions);
        setSessionDevices(
          parsed.map((s) =>
            s.isCurrent
              ? {
                  ...s,
                  browser: current.browser,
                  os: current.os,
                  deviceName: current.deviceName,
                  deviceType: current.deviceType,
                }
              : s
          )
        );
      } else {
        setSessionDevices((prev) =>
          prev.map((s) =>
            s.isCurrent
              ? {
                  ...s,
                  browser: current.browser,
                  os: current.os,
                  deviceName: current.deviceName,
                  deviceType: current.deviceType,
                }
              : s
          )
        );
      }
    } catch {
      // ignore
    }
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

  const updateUserRole = (userId: string, newRole: string) => {
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

  const addUser = (newUser: Omit<ManagedUser, 'id' | 'lastLogin'>) => {
    const id = `user-${Date.now()}`;
    const userToAdd: ManagedUser = {
      ...newUser,
      id,
      lastLogin: 'Never (Invited)',
    };
    saveUsers([...managedUsers, userToAdd]);
  };

  const deleteUser = (userId: string): boolean => {
    // Prevent deleting the currently active user or deleting all admins
    if (user && user.id === userId) {
      return false;
    }
    const filtered = managedUsers.filter((u) => u.id !== userId);
    saveUsers(filtered);
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
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanEmail = email.trim().toLowerCase();
    const normalizedEmail = cleanEmail.replace('@netlab.edu', '@lab.edu');

    // Check against managed users first
    const matchedManaged = managedUsers.find(
      (acc) =>
        acc.email.toLowerCase() === cleanEmail ||
        acc.email.toLowerCase().replace('@netlab.edu', '@lab.edu') === normalizedEmail
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
        acc.email.toLowerCase().replace('@netlab.edu', '@lab.edu') === normalizedEmail
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
    };
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {
      // ignore
    }
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
        addUser,
        deleteUser,
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
