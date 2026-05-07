import { StyleSheet, Text, View } from 'react-native';
import { InsightCard } from './InsightCard';
import type { DashboardInsight } from '../../types/dashboard.types';

type InsightSectionProps = {
  insight: DashboardInsight | null;
};

export const InsightSection = ({ insight }: InsightSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Insight</Text>
      <InsightCard insight={insight} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
});

