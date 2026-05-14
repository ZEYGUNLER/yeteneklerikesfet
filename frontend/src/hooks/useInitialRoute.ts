import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';
import { useChildren } from './useChildren';
import { ROUTES } from '@/navigation/routes';

export type InitialRouteResult = {
  initialRoute: string | null;
  reason: string | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  hasChildren: boolean;
};

/**
 * Centralized hook to determine the initial route of the application.
 * Handles platform-specific logic and initialization states.
 */
export const useInitialRoute = (): InitialRouteResult => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { children, isLoading: childrenLoading } = useChildren();
  
  const [result, setResult] = useState<InitialRouteResult>({
    initialRoute: null,
    reason: null,
    isInitializing: true,
    isAuthenticated: false,
    hasChildren: false,
  });

  useEffect(() => {
    // Wait for all essential data to load
    if (authLoading || childrenLoading) {
      return;
    }

    let initialRoute: string;
    let reason: string;
    const isWeb = Platform.OS === 'web';
    const hasChildren = children.length > 0;

    if (!isAuthenticated) {
      initialRoute = ROUTES.LOGIN;
      reason = 'unauthenticated_user';
    } else if (isWeb) {
      initialRoute = ROUTES.DASHBOARD;
      reason = 'authenticated_web_user';
    } else if (!hasChildren) {
      initialRoute = ROUTES.CREATE_CHILD;
      reason = 'authenticated_mobile_user_no_children';
    } else {
      initialRoute = ROUTES.PROFILE_PICKER;
      reason = 'authenticated_mobile_user_has_children';
    }

    if (__DEV__) {
      console.log(`[InitialRoute] DETERMINED: ${initialRoute} (REASON: ${reason})`);
    }

    setResult({
      initialRoute,
      reason,
      isInitializing: false,
      isAuthenticated,
      hasChildren,
    });
  }, [authLoading, childrenLoading, isAuthenticated, children.length]);

  return result;
};
