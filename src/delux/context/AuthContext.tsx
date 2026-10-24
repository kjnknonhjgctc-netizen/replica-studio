import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { AuthContext } from './authState';

export { useAuth } from './authState';
export type { AuthContextType } from './authState';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      // If token is invalid or no session, clear and set null
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const data = await api.register(email, password, name || '');
    setUser(data.user);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
