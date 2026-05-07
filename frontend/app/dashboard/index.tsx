import { DashboardScreen } from '../../src/screens/dashboard/DashboardScreen';

const FALLBACK_CHILD_ID = process.env.EXPO_PUBLIC_CHILD_ID ?? '';

export default function DashboardRoute() {
  return <DashboardScreen childId={FALLBACK_CHILD_ID} />;
}

