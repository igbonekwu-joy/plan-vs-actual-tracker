import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiRequest, ApiError } from '../api/client';

interface AuthContextValue {
  token: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'pva_token';
const EMAIL_KEY = 'pva_email';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));

  const login = useCallback(async (emailInput: string, password: string) => {
    const res = await apiRequest<{ token: string }>('/auth/login', {
      method: 'POST',
      body: { email: emailInput, password },
    });
    setToken(res.token);
    setEmail(emailInput);
    localStorage.setItem(STORAGE_KEY, res.token);
    localStorage.setItem(EMAIL_KEY, emailInput);
  }, []);

  const signup = useCallback(async (emailInput: string, password: string) => {
    await apiRequest('/auth/signup', { method: 'POST', body: { email: emailInput, password } });
    await login(emailInput, password);
  }, [login]);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EMAIL_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ token, email, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
