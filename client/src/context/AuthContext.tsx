'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Thoeurn Ratha',
    email: 'admin@netlab.edu',
    password: 'password123',
    role: 'Primary Lab Administrator',
    roleBadge: 'Admin',
    avatarText: 'TR',
    permissions: 'Full Read/Write Access & System Config',
    department: 'Engineering Block A - Room 102B',
    description: 'Full administrator privileges across all hardware, racks, and stock',
  },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchAccount: (account: DemoAccount) => void;
}

const STORAGE_KEY = 'netlab_auth_user';

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
    const stored = localStorage.getItem(STORAGE_KEY);
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Artificial network delay for realistic responsive feedback
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanEmail = email.trim().toLowerCase();

    // Check if it matches any demo account
    const matchedAccount = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === cleanEmail
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
      error: 'Invalid credentials. Please enter a valid NetLab email and password (min 6 characters).',
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

