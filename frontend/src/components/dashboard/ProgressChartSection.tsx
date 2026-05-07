import { StyleSheet, Text, View } from 'react-native';
import { ProgressLineChart } from './ProgressLineChart';
import type { ProgressPoint } from '../../types/dashboard.types';

type ProgressChartSectionProps = {
  data: ProgressPoint[];
  loading: boolean;
};

export const ProgressChartSection = ({
  data,
  loading,
}: ProgressChartSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Progress Trends</Text>
      {loading ? (
        <View style={styles.placeholder} />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Play more games to see progress trends</Text>
        </View>
      ) : (
        <ProgressLineChart data={data} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    height: 220,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

