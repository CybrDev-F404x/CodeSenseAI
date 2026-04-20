import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { authService, userService } from '../services/api';
import { applyTheme, type ThemeKey } from '../utils/theme';

// ── Types ──────────────────────────────────────────────────────
interface UserPreferences {
  theme: ThemeKey;
  notifications: { email: boolean; app: boolean };
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  preferences: UserPreferences | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const u: User = await userService.getMe();
    setUser(u);
    // Apply theme from server-persisted preferences (authoritative source)
    const theme = (u?.preferences?.theme ?? 'indigo') as ThemeKey;
    applyTheme(theme);
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser()
        .catch(() => {
          localStorage.removeItem('access_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token, refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    localStorage.setItem('access_token', data.access_token);
    setToken(data.access_token);
    const me: User = await userService.getMe();
    setUser(me);
    const theme = (me?.preferences?.theme ?? 'indigo') as ThemeKey;
    applyTheme(theme);
  };

  const register = async (email: string, password: string, fullName?: string) => {
    const payload: { email: string; password: string; full_name?: string } = {
      email: email.trim(),
      password,
    };
    if (fullName?.trim()) payload.full_name = fullName.trim();
    await authService.register(payload);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    applyTheme('indigo'); // reset to default
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
