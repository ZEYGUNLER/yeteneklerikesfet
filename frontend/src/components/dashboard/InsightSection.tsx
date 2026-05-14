import { StyleSheet, Text, View } from 'react-native';
import { InsightCard } from './InsightCard';
import type { DashboardInsight } from '../../types/dashboard.types';

type InsightSectionProps = {
  insight: DashboardInsight | null;
  isMobile: boolean;
};

export const InsightSection = ({ insight, isMobile }: InsightSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Insight</Text>
      <Text style={styles.sectionSubtitle}>Helpful guidance from latest analysis</Text>
      <InsightCard insight={insight} isMobile={isMobile} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
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
    marginBottom: 4,
  },
});

