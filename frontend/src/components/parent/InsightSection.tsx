import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DashboardCard } from './DashboardCard';
import type { DashboardInsight, SkillSummary } from '../../types/dashboard.types';
import { generateInsights } from '../../services/insightEngine';

interface InsightSectionProps {
  insight: DashboardInsight | null;
  summary?: SkillSummary | null;
  sessionCount?: number;
}

export const InsightSection = ({ insight, summary, sessionCount = 0 }: InsightSectionProps) => {
  const isPositive = insight?.trend === 'positive';
  const isWarning = insight?.trend === 'warning';
  
  const generatedInsights = generateInsights(summary || null, sessionCount);

  return (
    <DashboardCard 
      title="Ebeveyn Öngörüleri" 
      subtitle="Analizlerimize dayalı kişiselleştirilmiş rehberlik."
    >
      <View style={[
        styles.insightBox,
        isPositive && styles.boxPositive,
        isWarning && styles.boxWarning
      ]}>
        <View style={styles.header}>
          <Text style={styles.emoji}>
            {isPositive ? '🚀' : isWarning ? '💡' : '📈'}
          </Text>
          <Text style={[
            styles.status,
            isPositive && styles.textPositive,
            isWarning && styles.textWarning
          ]}>
            {isPositive ? 'GELİŞİM SİNYALİ' : isWarning ? 'ODAK ÖNERİSİ' : 'DURUM ÖZETİ'}
          </Text>
        </View>
        <Text style={styles.message}>
          {insight?.message || generatedInsights[0]}
        </Text>
        
        {insight?.message && generatedInsights[0] && (
          <View style={styles.footer}>
            <Text style={styles.actionLabel}>Otomatik Öngörü:</Text>
            <Text style={styles.actionText}>
              {generatedInsights[0]}
            </Text>
          </View>
        )}
      </View>
    </DashboardCard>
  );
};

const styles = StyleSheet.create({
  insightBox: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  boxPositive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  boxWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 18,
  },
  status: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6B7280',
  },
  textPositive: {
    color: '#047857',
  },
  textWarning: {
    color: '#B45309',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#1F2937',
  },
  footer: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  actionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
