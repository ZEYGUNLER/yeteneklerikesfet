import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ChildProvider } from '@/context/ChildContext';
import { ProgressionProvider } from '@/context/ProgressionContext';
import { ParentProvider } from '@/context/ParentContext';
import { ThemeProvider } from '@/theme';
import { syncService } from '@/services/sync.service';

if (typeof window !== 'undefined') {
  (window as any).myConsoleLogs = (window as any).myConsoleLogs || [];
  const origLog = console.log;
  console.log = (...args) => {
    try {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      (window as any).myConsoleLogs.push(msg);
    } catch (e) {}
    origLog.apply(console, args);
  };
  const origError = console.error;
  console.error = (...args) => {
    try {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      (window as any).myConsoleLogs.push('[ERROR] ' + msg);
    } catch (e) {}
    origError.apply(console, args);
  };
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,              // always consider data stale
      refetchOnMount: 'always',  // refetch from server on every mount
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Run an initial sync check
    void syncService.syncPending();

    // Listen to AppState transitions
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void syncService.syncPending();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ParentProvider>
            <ChildProvider>
              <ProgressionProvider>
                <ThemeProvider>
                  <Stack screenOptions={{ headerShown: false }} />
                </ThemeProvider>
              </ProgressionProvider>
            </ChildProvider>
          </ParentProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

