import { createContext, useContext } from 'react';
import type { UserProfile } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

// Preserve identity during hot updates: mounted providers and consumers must
// never hold different context objects while the preview updates.
export const AuthContext =
  (import.meta.hot?.data?.['authContext'] as React.Context<AuthContextType | undefined> | undefined)
  ?? createContext<AuthContextType | undefined>(undefined);

if (import.meta.hot?.data) {
  import.meta.hot.data['authContext'] = AuthContext;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
