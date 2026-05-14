import { Slot } from 'expo-router';
import { ParentLayout } from '@/layouts/ParentLayout';

export default function ParentWorldLayout() {
  return (
    <ParentLayout>
      <Slot />
    </ParentLayout>
  );
}
