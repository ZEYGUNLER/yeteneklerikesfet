import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService, type LoginPayload, type RegisterPayload } from '@/services/auth.service';
import { setApiToken, setUnauthorizedHandler } from '@/services/api';
import { persist } from '@/services/storage';

const AUTH_TOKEN_KEY = 'yk.auth.token';
const AUTH_USER_KEY = 'yk.auth.userId';
const AUTH_EMAIL_KEY = 'yk.auth.email';

export type AuthState = {
  userId: string | null;
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const decodeUserIdFromToken = (token: string): string | null => {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    const payload = JSON.parse(decoded) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    userId: null,
    token: null,
    email: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const logout = useCallback(async () => {
    await Promise.all([
      persist.remove(AUTH_TOKEN_KEY),
      persist.remove(AUTH_USER_KEY),
      persist.remove(AUTH_EMAIL_KEY),
      persist.remove('yk.child.selected'),
    ]);
    setApiToken(null);
    setState({
      userId: null,
      token: null,
      email: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    const restore = async () => {
      const [token, userId, email] = await Promise.all([
        persist.get(AUTH_TOKEN_KEY),
        persist.get(AUTH_USER_KEY),
        persist.get(AUTH_EMAIL_KEY),
      ]);

      setApiToken(token);
      setUnauthorizedHandler(token ? logout : null);
      setState({
        userId,
        token,
        email,
        isAuthenticated: Boolean(token),
        isLoading: false,
      });
    };

    restore();

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const applySession = useCallback(async (token: string, email?: string) => {
    const userId = decodeUserIdFromToken(token);
    await Promise.all([
      persist.set(AUTH_TOKEN_KEY, token),
      persist.set(AUTH_USER_KEY, userId ?? ''),
      email ? persist.set(AUTH_EMAIL_KEY, email) : Promise.resolve(),
    ]);

    setApiToken(token);
    setUnauthorizedHandler(logout);
    setState(prev => ({
      ...prev,
      userId,
      token,
      email: email ?? prev.email,
      isAuthenticated: true,
      isLoading: false,
    }));
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: async (payload) => {
        const data = await authService.login(payload);
        await applySession(data.accessToken, payload.email);
      },
      register: async (payload) => {
        const data = await authService.register(payload);
        await applySession(data.accessToken, payload.email);
      },
      logout,
    }),
    [applySession, logout, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
