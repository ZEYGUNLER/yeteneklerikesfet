import { StyleSheet, Text, View } from 'react-native';
import { ProgressLineChart } from './ProgressLineChart';
import type { ProgressPoint } from '../../types/dashboard.types';

type ProgressChartSectionProps = {
  data: ProgressPoint[];
  loading: boolean;
  isMobile: boolean;
};

export const ProgressChartSection = ({
  data,
  loading,
  isMobile,
}: ProgressChartSectionProps) => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Progress Trends</Text>
          <Text style={styles.sectionSubtitle}>Recent sessions and skill trajectory</Text>
        </View>
        <View style={[styles.legend, isMobile && styles.legendMobile]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.legendText}>Memory</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Attention</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Logic</Text>
          </View>
        </View>
      </View>
      {loading ? (
        <View style={styles.placeholder}>
          <View style={styles.skeletonGrid} />
          <View style={[styles.skeletonBar, { width: '85%', opacity: 0.8 }]} />
          <View style={[styles.skeletonBar, { width: '65%', opacity: 0.6 }]} />
          <View style={[styles.skeletonBar, { width: '72%', opacity: 0.4 }]} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyCircle} />
          <Text style={styles.emptyTitle}>No trend data yet</Text>
          <Text style={styles.emptyText}>
            Complete a game session to unlock progress charts.
          </Text>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    gap: 20,
  },
  header: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubtitle: {
    color: '#4B5563',
    fontSize: 14,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendMobile: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  placeholder: {
    height: 260,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  skeletonGrid: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  skeletonBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  },
});

