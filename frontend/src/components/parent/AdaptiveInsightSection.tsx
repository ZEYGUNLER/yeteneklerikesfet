/**
 * ADAPTIVE INSIGHT SECTION — Phase G7
 *
 * Parent-facing analytics card showing adaptive intelligence trends.
 * Translates internal engine data into readable, meaningful insights.
 *
 * DESIGN PRINCIPLES:
 *   - Use plain, warm language — no scientific jargon
 *   - Show positive framing where possible
 *   - Keep it scannable (4 key metrics max)
 *   - Never show raw scores — only trend indicators
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DashboardCard } from './DashboardCard';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AdaptiveSessionSummary {
  confidenceScore: number;       // 0–1
  fatigueIndex: number;          // 0–1
  frustrationLevel: number;      // 0–1
  easingRatio: number;           // 0–1 (how often system eased difficulty)
  escalationRatio: number;       // 0–1 (how often system escalated difficulty)
  dominantEncouragement: 'support' | 'neutral' | 'celebrate';
  sessionMood: string;
}

interface AdaptiveInsightSectionProps {
  /** Latest session's adaptive data. Pass null if no adaptive sessions yet. */
  latestSession: AdaptiveSessionSummary | null;
}

// ─── Metric Config ───────────────────────────────────────────────────────────────

function getResilienceLabel(frustration: number, easing: number): string {
  if (frustration < 0.25 && easing < 0.25) return 'Güçlü';
  if (frustration < 0.50) return 'Gelişiyor';
  return 'Destek Aldı';
}

function getResilienceColor(frustration: number): string {
  if (frustration < 0.25) return '#059669'; // green
  if (frustration < 0.50) return '#D97706'; // amber
  return '#DC2626'; // red
}

function getConsistencyLabel(fatigueIndex: number): string {
  if (fatigueIndex < 0.30) return 'Yüksek Odak';
  if (fatigueIndex < 0.60) return 'Orta Odak';
  return 'Yorgunluk Sinyali';
}

function getConsistencyColor(fatigueIndex: number): string {
  if (fatigueIndex < 0.30) return '#059669';
  if (fatigueIndex < 0.60) return '#D97706';
  return '#DC2626';
}

function getEngagementLabel(escalation: number, confidence: number): string {
  if (escalation > 0.50 && confidence > 0.65) return 'Zorluk Arttı';
  if (escalation > 0.25) return 'Dengeli İlerleme';
  if (escalation < 0.10) return 'Rahat Tempoda';
  return 'Dengeli';
}

function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    focused: '🎯',
    excited: '🚀',
    tired: '😴',
    frustrated: '😤',
    overwhelmed: '😟',
    neutral: '😊',
  };
  return map[mood] || '😊';
}

function getMoodLabel(mood: string): string {
  const map: Record<string, string> = {
    focused: 'Odaklanmış',
    excited: 'Heyecanlı',
    tired: 'Yorgun',
    frustrated: 'Zorlandı',
    overwhelmed: 'Aşırı Yüklenmiş',
    neutral: 'Dengeli',
  };
  return map[mood] || 'Dengeli';
}

// ─── Metric Row ──────────────────────────────────────────────────────────────────

function MetricRow({
  icon,
  label,
  value,
  valueColor = '#111827',
  subtext,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  subtext?: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <View style={styles.metricInfo}>
        <Text style={styles.metricLabel}>{label}</Text>
        {subtext ? <Text style={styles.metricSubtext}>{subtext}</Text> : null}
      </View>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────────

export const AdaptiveInsightSection = ({ latestSession }: AdaptiveInsightSectionProps) => {
  if (!latestSession) {
    return (
      <DashboardCard
        title="Adaptif Zeka Özeti"
        subtitle="Her oyun oturumunda sistem çocuğunuzu gözlemler."
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🧠</Text>
          <Text style={styles.emptyText}>
            Adaptif analiz için önce birkaç oyun oturumu tamamlanmalıdır.
          </Text>
        </View>
      </DashboardCard>
    );
  }

  const {
    confidenceScore,
    fatigueIndex,
    frustrationLevel,
    easingRatio,
    escalationRatio,
    dominantEncouragement,
    sessionMood,
  } = latestSession;

  const resilienceLabel = getResilienceLabel(frustrationLevel, easingRatio);
  const resilienceColor = getResilienceColor(frustrationLevel);
  const consistencyLabel = getConsistencyLabel(fatigueIndex);
  const consistencyColor = getConsistencyColor(fatigueIndex);
  const engagementLabel = getEngagementLabel(escalationRatio, confidenceScore);
  const moodEmoji = getMoodEmoji(sessionMood);
  const moodLabel = getMoodLabel(sessionMood);

  // Encouragement mode → parent-friendly interpretation
  const encouragementNote =
    dominantEncouragement === 'support'
      ? 'Sistem çocuğunuzu destekleyici modda karşıladı.'
      : dominantEncouragement === 'celebrate'
      ? 'Sistem üst seviye zorluklarla çocuğu ödüllendirdi.'
      : 'Sistem dengeli bir yaklaşım sergiledi.';

  return (
    <DashboardCard
      title="Adaptif Zeka Özeti"
      subtitle="Sistemin bu oturumda çocuğunuzu nasıl karşıladığı."
    >
      <View style={styles.container}>

        {/* ── Session Mood Banner ── */}
        <View style={styles.moodBanner}>
          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          <View>
            <Text style={styles.moodLabel}>Oturum Ruh Hali</Text>
            <Text style={styles.moodValue}>{moodLabel}</Text>
          </View>
        </View>

        {/* ── Key Metrics ── */}
        <View style={styles.metrics}>
          <MetricRow
            icon="💪"
            label="Hayal Kırıklığı Direnci"
            value={resilienceLabel}
            valueColor={resilienceColor}
            subtext="Başarısızlık sonrası toparlanma hızı"
          />
          <View style={styles.divider} />
          <MetricRow
            icon="🎯"
            label="Odak Tutarlılığı"
            value={consistencyLabel}
            valueColor={consistencyColor}
            subtext="Oturum boyunca dikkat seviyesi"
          />
          <View style={styles.divider} />
          <MetricRow
            icon="📈"
            label="Zorluk Dengesi"
            value={engagementLabel}
            subtext="Sistem hangi yönde ayarlama yaptı?"
          />
        </View>

        {/* ── Encouragement Note ── */}
        <View style={styles.noteBox}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>{encouragementNote}</Text>
        </View>

      </View>
    </DashboardCard>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  moodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  moodEmoji: {
    fontSize: 36,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  metrics: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  metricIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  metricInfo: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  metricSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noteIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    maxWidth: 280,
  },
});
