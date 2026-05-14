import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthContext } from './AuthContext';
import { authService } from '@/services/auth.service';
import { persist } from '@/services/storage';

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const VERIFIED_AT_KEY = 'yk.parent.verified_at';

interface ParentContextType {
  isParentVerified: boolean;
  lastVerification: number | null;
  verifyParent: (password: string) => Promise<void>;
  clearParentSession: () => void;
  checkVerification: () => boolean;
}

const ParentContext = createContext<ParentContextType | undefined>(undefined);

export const ParentProvider = ({ children }: { children: React.ReactNode }) => {
  const { email } = useAuthContext();
  const [lastVerification, setLastVerification] = useState<number | null>(null);
  const appState = useRef(AppState.currentState);

  // Restore session from storage
  useEffect(() => {
    const restore = async () => {
      const stored = await persist.get(VERIFIED_AT_KEY);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        if (!isNaN(timestamp)) {
          setLastVerification(timestamp);
        }
      }
    };
    restore();
  }, []);

  const isParentVerified = useMemo(() => {
    if (!lastVerification) return false;
    const now = Date.now();
    return now - lastVerification < SESSION_DURATION_MS;
  }, [lastVerification]);

  const clearParentSession = useCallback(() => {
    setLastVerification(null);
    persist.remove(VERIFIED_AT_KEY);
    if (__DEV__) console.log('[ParentSecurity] Session cleared');
  }, []);

  const verifyParent = useCallback(async (password: string) => {
    if (!email) throw new Error('No parent email found in auth context');
    
    await authService.login({ email, password });
    
    const now = Date.now();
    setLastVerification(now);
    await persist.set(VERIFIED_AT_KEY, now.toString());
    if (__DEV__) console.log('[ParentSecurity] Parent verified at', new Date(now).toLocaleTimeString());
  }, [email]);

  const checkVerification = useCallback(() => {
    if (!lastVerification) return false;
    const now = Date.now();
    const isValid = now - lastVerification < SESSION_DURATION_MS;
    if (!isValid && lastVerification) {
      clearParentSession();
    }
    return isValid;
  }, [lastVerification, clearParentSession]);

  // Handle App Resume re-auth trigger
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (__DEV__) console.log('[ParentSecurity] App resumed, checking session...');
        checkVerification();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkVerification]);

  const value = useMemo(() => ({
    isParentVerified,
    lastVerification,
    verifyParent,
    clearParentSession,
    checkVerification
  }), [isParentVerified, lastVerification, verifyParent, clearParentSession, checkVerification]);

  return <ParentContext.Provider value={value}>{children}</ParentContext.Provider>;
};

export const useParentContext = () => {
  const context = useContext(ParentContext);
  if (!context) throw new Error('useParentContext must be used within ParentProvider');
  return context;
};
