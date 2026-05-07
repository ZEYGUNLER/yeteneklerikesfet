import { StyleSheet, Text, View } from 'react-native';

export type SkillCardProps = {
  title: string;
  value: number;
};

export const SkillCard = ({ title, value }: SkillCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{Math.round(value)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 96,
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
});

