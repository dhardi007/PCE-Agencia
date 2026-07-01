import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../store/authStore';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { nombre: string; email: string; password: string; rol?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, refreshToken, login: storeLogin, logout: storeLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const refreshAuth = useCallback(async () => {
    if (!refreshToken) return;
    try {
      const res = await authApi.refresh(refreshToken);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data;
      useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
    } catch {
      useAuthStore.getState().logout();
    }
  }, [refreshToken]);

  useEffect(() => {
    const initAuth = async () => {
      if (accessToken && !user) {
        // El usuario ya está en el store si hay accessToken
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [accessToken, user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await authApi.login({ email, password });
    const { usuario, accessToken, refreshToken } = res.data;
    storeLogin(usuario, accessToken, refreshToken);
    setIsLoading(false);
  };

  const register = async (userData: { nombre: string; email: string; password: string; rol?: string }) => {
    setIsLoading(true);
    const res = await authApi.register(userData);
    const { usuario, accessToken, refreshToken } = res.data;
    storeLogin(usuario, accessToken, refreshToken);
    setIsLoading(false);
  };

  const logout = async () => {
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch {}
    }
    storeLogout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}