import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { useChildContext } from '@/context/ChildContext';

export default function DashboardRoute() {
  const { selectedChild } = useChildContext();
  return <DashboardScreen childId={selectedChild?.id ?? ''} />;
}
