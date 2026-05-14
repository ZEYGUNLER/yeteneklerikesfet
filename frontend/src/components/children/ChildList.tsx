import { StyleSheet, Text, View } from 'react-native';
import type { Child } from '@/services/child.service';
import { ChildCard } from './ChildCard';

type ChildListProps = {
  items: Child[];
  selectedChildId: string | null;
  onSelect: (child: Child) => void;
  loading: boolean;
};

export const ChildList = ({
  items,
  selectedChildId,
  onSelect,
  loading,
}: ChildListProps) => {
  if (loading) {
    return <Text style={styles.helper}>Loading children...</Text>;
  }

  if (items.length === 0) {
    return <Text style={styles.helper}>No child profile yet. Create your first one.</Text>;
  }

  return (
    <View style={styles.list}>
      {items.map((child) => (
        <ChildCard
          key={child.id}
          child={child}
          selected={selectedChildId === child.id}
          onPress={() => onSelect(child)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  helper: {
    color: '#6B7280',
    fontSize: 15,
  },
});
