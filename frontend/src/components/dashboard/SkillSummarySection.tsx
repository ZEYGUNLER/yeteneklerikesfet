import { StyleSheet, Text, View } from 'react-native';
import { SkillCard } from './SkillCard';
import type { SkillSummary } from '../../types/dashboard.types';

type SkillSummarySectionProps = {
  summary: SkillSummary | null;
  loading: boolean;
  isMobile: boolean;
};

export const SkillSummarySection = ({
  summary,
  loading,
  isMobile,
}: SkillSummarySectionProps) => {
  const updatedLabel = summary?.lastUpdated
    ? new Date(summary.lastUpdated).toLocaleDateString()
    : 'Waiting for first session';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Current Skills</Text>
      <Text style={styles.sectionSubtitle}>Snapshot of cognitive strengths</Text>
      <View style={[styles.row, isMobile && styles.rowMobile]}>
        <SkillCard title="Memory" value={loading ? 0 : summary?.memory ?? 0} />
        <SkillCard
          title="Attention"
          value={loading ? 0 : summary?.attention ?? 0}
        />
        <SkillCard title="Logic" value={loading ? 0 : summary?.logic ?? 0} />
      </View>
      <Text style={styles.updatedAt}>Last updated: {updatedLabel}</Text>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowMobile: {
    flexDirection: 'column',
  },
  updatedAt: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

