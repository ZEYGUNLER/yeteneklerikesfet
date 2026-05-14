import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout as AuthWorldLayout } from '@/layouts/AuthLayout';
import { ROUTES } from '@/navigation/routes';
import { ScreenLoader } from '@/components/common/ScreenLoader';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <ScreenLoader />;

  if (isAuthenticated) {
    return <Redirect href={ROUTES.ROOT as any} />;
  }

  return (
    <AuthWorldLayout>
      <Slot />
    </AuthWorldLayout>
  );
}
