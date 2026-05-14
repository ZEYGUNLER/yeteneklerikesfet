import { Slot } from 'expo-router';
import { ChildLayout } from '@/layouts/ChildLayout';

export default function ChildWorldLayout() {
  return (
    <ChildLayout>
      <Slot />
    </ChildLayout>
  );
}
