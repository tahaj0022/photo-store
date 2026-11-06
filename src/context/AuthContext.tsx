import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, StorageStats } from '../types';
import { api, getStoredToken, removeStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  stats: StorageStats | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  demoLogin: () => Promise<void>;
  updateProfile: (params: { name?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshStats = useCallback(async () => {
    try {
      if (getStoredToken()) {
        const statsData = await api.getStats();
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Failed to refresh stats:', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const stored = getStoredToken();
      if (!stored) {
        setUser(null);
        setStats(null);
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setToken(stored);
      await refreshStats();
    } catch {
      removeStoredToken();
      setUser(null);
      setToken(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setToken(res.token);
      await refreshStats();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.register(name, email, password);
      setUser(res.user);
      setToken(res.token);
      await refreshStats();
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    await login('demo@auraphoto.app', 'password123');
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setToken(null);
    setStats(null);
  };

  const updateProfile = async (params: { name?: string; currentPassword?: string; newPassword?: string }) => {
    const res = await api.updateProfile(params);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        stats,
        isLoading,
        login,
        register,
        logout,
        demoLogin,
        updateProfile,
        refreshStats,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
