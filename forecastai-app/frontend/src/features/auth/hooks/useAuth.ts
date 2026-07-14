import { useState, useEffect, useCallback } from 'react';
import { authApi, tokenManager } from '../services/auth.service';
import { User } from '../../../shared/types/features';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = tokenManager.getToken();
    if (token) {
      setIsAuthenticated(true);
      const stored = localStorage.getItem('forecastai_user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, user: userData } = res.data;
    tokenManager.setToken(token);
    localStorage.setItem('forecastai_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const res = await authApi.register(email, password, name);
    const { token, user: userData } = res.data;
    tokenManager.setToken(token);
    localStorage.setItem('forecastai_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  }, []);

  const logout = useCallback(() => {
    tokenManager.removeToken();
    localStorage.removeItem('forecastai_user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return { user, isLoading, isAuthenticated, login, register, logout };
}
