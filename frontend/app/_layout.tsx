import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ChildProvider } from '@/context/ChildContext';
import { ParentProvider } from '@/context/ParentContext';

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ParentProvider>
          <ChildProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ChildProvider>
        </ParentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

