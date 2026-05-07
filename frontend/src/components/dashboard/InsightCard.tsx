import { StyleSheet, Text, View } from 'react-native';
import type { DashboardInsight } from '../../types/dashboard.types';

type InsightCardProps = {
  insight: DashboardInsight | null;
};

const trendColors: Record<DashboardInsight['trend'], string> = {
  positive: '#059669',
  warning: '#D97706',
  neutral: '#4B5563',
};

export const InsightCard = ({ insight }: InsightCardProps) => {
  const trend = insight?.trend ?? 'neutral';

  return (
    <View style={styles.card}>
      <Text style={[styles.trend, { color: trendColors[trend] }]}>
        {trend.toUpperCase()}
      </Text>
      <Text style={styles.message}>
        {insight?.message ?? 'Insights will appear after new sessions are analyzed.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  trend: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
});

