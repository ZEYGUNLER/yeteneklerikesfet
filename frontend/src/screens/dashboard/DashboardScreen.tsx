import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { InsightSection } from '../../components/dashboard/InsightSection';
import { ProgressChartSection } from '../../components/dashboard/ProgressChartSection';
import { SkillSummarySection } from '../../components/dashboard/SkillSummarySection';
import { useDashboard } from '../../hooks/useDashboard';

type DashboardScreenProps = {
  childId: string;
};

export const DashboardScreen = ({ childId }: DashboardScreenProps) => {
  const { width } = useWindowDimensions();
  const { summary, progress, insight, loading, error } = useDashboard(childId);
  const isWide = width >= 900;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.container, isWide && styles.containerWide]}>
        <Text style={styles.title}>Parent Dashboard</Text>
        <Text style={styles.subtitle}>
          Track your child&apos;s skills and learning trends.
        </Text>

        {error ? <Text style={styles.error}>Failed to load dashboard data.</Text> : null}

        <SkillSummarySection summary={summary} loading={loading} />
        <ProgressChartSection data={progress} loading={loading} />
        <InsightSection insight={insight} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
  },
  container: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    gap: 24,
  },
  containerWide: {
    maxWidth: 920,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 15,
    marginTop: -10,
  },
  error: {
    color: '#B91C1C',
    fontSize: 14,
  },
});

