import { StyleSheet, Text, View } from 'react-native';
import { SkillCard } from './SkillCard';
import type { SkillSummary } from '../../types/dashboard.types';

type SkillSummarySectionProps = {
  summary: SkillSummary | null;
  loading: boolean;
};

export const SkillSummarySection = ({
  summary,
  loading,
}: SkillSummarySectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Current Skills</Text>
      <View style={styles.row}>
        <SkillCard title="Memory" value={loading ? 0 : summary?.memory ?? 0} />
        <SkillCard
          title="Attention"
          value={loading ? 0 : summary?.attention ?? 0}
        />
        <SkillCard title="Logic" value={loading ? 0 : summary?.logic ?? 0} />
      </View>
      <Text style={styles.updatedAt}>
        Last updated:{' '}
        {summary?.lastUpdated
          ? new Date(summary.lastUpdated).toLocaleDateString()
          : '-'}
      </Text>
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  updatedAt: {
    fontSize: 12,
    color: '#6B7280',
  },
});

