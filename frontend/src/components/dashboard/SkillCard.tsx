import { StyleSheet, Text, View } from 'react-native';

export type SkillCardProps = {
  title: string;
  value: number;
};

export const SkillCard = ({ title, value }: SkillCardProps) => {
  const rounded = Math.round(value);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Now</Text>
        </View>
      </View>
      <Text style={styles.value}>{rounded}%</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, rounded))}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 96,
    flex: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  value: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 38,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563EB',
  },
});

