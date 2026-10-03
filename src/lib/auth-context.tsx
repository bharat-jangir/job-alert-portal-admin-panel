'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/axios';

/**
 * Must match backend AdminRole enum exactly.
 * If the backend adds a role, add it here too.
 */
export enum AdminRole {
  SUPER_ADMIN = 'super-admin',
  PUBLISHER = 'publisher',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: AdminRole;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredRoles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Role hierarchy for client-side permission checks.
 * Super admin has all permissions; each role inherits from lower ones.
 */
const ROLE_HIERARCHY: Record<AdminRole, number> = {
  [AdminRole.SUPER_ADMIN]: 4,
  [AdminRole.PUBLISHER]: 3,
  [AdminRole.EDITOR]: 2,
  [AdminRole.VIEWER]: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('admin_token');
      const storedUser = localStorage.getItem('admin_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data?.data || response.data;

    // Store token immediately so the next request uses it
    localStorage.setItem('admin_token', access_token);
    setToken(access_token);

    // Fetch user profile with the new token
    const profileResponse = await api.get('/auth/profile', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profileData = profileResponse.data?.data || profileResponse.data;
    const adminUser: AdminUser = {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      role: profileData.role as AdminRole,
    };

    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    setUser(adminUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    window.location.href = '/admin/login';
  }, []);

  /**
   * Client-side role check using hierarchy.
   * If the user's role level is >= any of the required role levels, permission is granted.
   */
  const hasPermission = useCallback(
    (requiredRoles: AdminRole[]) => {
      if (!user) return false;
      const userLevel = ROLE_HIERARCHY[user.role] || 0;
      return requiredRoles.some((role) => userLevel >= ROLE_HIERARCHY[role]);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
