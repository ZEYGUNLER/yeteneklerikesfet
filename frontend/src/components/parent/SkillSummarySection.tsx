import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DashboardCard } from './DashboardCard';
import type { SkillSummary } from '../../types/dashboard.types';

interface SkillSummarySectionProps {
  summary: SkillSummary | null;
  loading: boolean;
}

export const SkillSummarySection = ({ summary, loading }: SkillSummarySectionProps) => {
  const skills = [
    { id: 'memory', label: 'Hafıza', value: summary?.memory ?? 0, color: '#6366F1', icon: '🧠' },
    { id: 'attention', label: 'Dikkat', value: summary?.attention ?? 0, color: '#10B981', icon: '🎯' },
    { id: 'logic', label: 'Mantık', value: summary?.logic ?? 0, color: '#F59E0B', icon: '⚡' },
  ];

  return (
    <DashboardCard 
      title="Becerilere Genel Bakış" 
      subtitle="Bilişsel gelişim alanlarındaki mevcut durum."
    >
      <View style={styles.grid}>
        {skills.map((skill) => (
          <View key={skill.id} style={styles.skillItem}>
            <View style={styles.skillHeader}>
              <View style={[styles.iconBox, { backgroundColor: skill.color + '15' }]}>
                <Text style={styles.icon}>{skill.icon}</Text>
              </View>
              <View>
                <Text style={styles.skillLabel}>{skill.label}</Text>
                <Text style={styles.skillValue}>
                  {loading ? '...' : `${Math.round(skill.value)}%`}
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <View 
                style={[
                  styles.bar, 
                  { backgroundColor: skill.color, width: `${loading ? 0 : skill.value}%` }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
    </DashboardCard>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: 20,
  },
  skillItem: {
    gap: 10,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  skillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  track: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});
