import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ScreenLoader } from '@/components/common/ScreenLoader';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <ScreenLoader />;

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Her ekran kendi boş durumunu yönetir (Dashboard, GameSelection, vs.)
  return <Slot />;
}
