import { StyleSheet, Text, View } from 'react-native';
import type { DashboardInsight } from '../../types/dashboard.types';

type InsightCardProps = {
  insight: DashboardInsight | null;
  isMobile: boolean;
};

const trendColors: Record<DashboardInsight['trend'], string> = {
  positive: '#059669',
  warning: '#D97706',
  neutral: '#4B5563',
};

export const InsightCard = ({ insight, isMobile }: InsightCardProps) => {
  const trend = insight?.trend ?? 'neutral';
  const trendLabel = trend.toUpperCase();

  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: `${trendColors[trend]}1A` }]}>
          <Text style={[styles.trend, { color: trendColors[trend] }]}>{trendLabel}</Text>
        </View>
      </View>
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
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  cardMobile: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    fontWeight: '500',
  },
});

