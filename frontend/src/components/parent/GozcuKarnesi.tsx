import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Animated,
  ActivityIndicator
} from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, Polyline, G } from 'react-native-svg';
import { CognitiveProfile, CognitiveDomainScores } from '../../services/cognitiveScoringEngine';
import { ReportEngine, ParentInsightReport, InsightItem, RecommendationItem } from '../../services/reportEngine';
import { TrendPeriod, TrendDataPoint } from '../../services/profileAggregationService';
import { LongitudinalReport } from '../../services/longitudinalAnalysisEngine';
import { AdaptiveRecommendationEngine, AdaptiveRecommendationReport, AdaptiveRecommendationItem } from '../../services/adaptiveRecommendationEngine';
import { AIInsightService } from '../../services/ai/AIInsightService';
import { AIInsight } from '../../services/ai/providers/AIProvider';

// ── interfaces for compatibility ──
export interface NarrativeSection {
  title: string;
  content: string;
}

export interface StrengthItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface GrowthOpportunityItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface GozcuKarnesiProps {
  childId: string;
  realProfile: CognitiveProfile | null;
  realReport: ParentInsightReport | null;
  realTrendData: TrendDataPoint[];
  realLongitudinalReport: LongitudinalReport | null;
  realAdaptiveRecommendations: AdaptiveRecommendationReport | null;
  loading?: boolean;
}

const DOMAINS: { key: keyof CognitiveDomainScores; label: string; color: string; icon: string }[] = [
  { key: 'attention', label: 'Dikkat', color: '#10B981', icon: '🎯' },
  { key: 'inhibition', label: 'Dürtü Kontrolü', color: '#8B5CF6', icon: '🛑' },
  { key: 'processingSpeed', label: 'İşlem Hızı', color: '#F59E0B', icon: '⚡' },
  { key: 'workingMemory', label: 'Çalışan Bellek', color: '#3B82F6', icon: '🧠' },
  { key: 'planning', label: 'Planlama', color: '#EC4899', icon: '🧭' },
];

const MOCK_PROFILES_DATA: Record<string, { label: string; profile: CognitiveProfile }> = {
  high: {
    label: 'Üstün Performans (High Performer)',
    profile: {
      currentScores: { attention: 92, inhibition: 90, processingSpeed: 91, workingMemory: 88, planning: 94 },
      relativeLevels: { attention: 95, inhibition: 95, processingSpeed: 96, workingMemory: 97, planning: 98 },
      trends: { attention: 'improving', inhibition: 'stable', processingSpeed: 'improving', workingMemory: 'stable', planning: 'improving' },
      metaMetrics: { overallConsistencyScore: 92, fatigueResistance: 88 },
      confidenceScores: { attention: 0.95, inhibition: 0.95, processingSpeed: 0.90, workingMemory: 0.92, planning: 0.96 },
      confidenceReasons: { attention: 'test', inhibition: 'test', processingSpeed: 'test', workingMemory: 'test', planning: 'test' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  },
  mixed: {
    label: 'Dengeli / Karışık (Mixed Performer)',
    profile: {
      currentScores: { attention: 75, inhibition: 68, processingSpeed: 72, workingMemory: 55, planning: 64 },
      relativeLevels: { attention: 75, inhibition: 75, processingSpeed: 76, workingMemory: 77, planning: 78 },
      trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 75, fatigueResistance: 70 },
      confidenceScores: { attention: 0.9, inhibition: 0.9, processingSpeed: 0.8, workingMemory: 0.85, planning: 0.9 },
      confidenceReasons: { attention: 'test', inhibition: 'test', processingSpeed: 'test', workingMemory: 'test', planning: 'test' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  },
  low_confidence: {
    label: 'Düşük Güven (Low Confidence)',
    profile: {
      currentScores: { attention: 60, inhibition: 62, processingSpeed: 58, workingMemory: 64, planning: 55 },
      relativeLevels: { attention: 50, inhibition: 50, processingSpeed: 50, workingMemory: 50, planning: 50 },
      trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 75, fatigueResistance: 70 },
      confidenceScores: { attention: 0.1, inhibition: 0.1, processingSpeed: 0.1, workingMemory: 0.1, planning: 0.1 },
      confidenceReasons: { attention: 'test', inhibition: 'test', processingSpeed: 'test', workingMemory: 'test', planning: 'test' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  },
  strong_planner: {
    label: 'Planlama Güçlü / Bellek Hassas',
    profile: {
      currentScores: { attention: 75, inhibition: 78, processingSpeed: 68, workingMemory: 42, planning: 86 },
      relativeLevels: { attention: 75, inhibition: 78, processingSpeed: 68, workingMemory: 42, planning: 86 },
      trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'improving' },
      metaMetrics: { overallConsistencyScore: 88, fatigueResistance: 85 },
      confidenceScores: { attention: 1.0, inhibition: 1.0, processingSpeed: 1.0, workingMemory: 1.0, planning: 1.0 },
      confidenceReasons: { attention: 'test', inhibition: 'test', processingSpeed: 'test', workingMemory: 'test', planning: 'test' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  },
  fast_impulsive: {
    label: 'Hızlı ve Sabırsız (Fast & Impulsive)',
    profile: {
      currentScores: { attention: 65, inhibition: 38, processingSpeed: 88, workingMemory: 72, planning: 60 },
      relativeLevels: { attention: 65, inhibition: 38, processingSpeed: 88, workingMemory: 72, planning: 60 },
      trends: { attention: 'stable', inhibition: 'declining', processingSpeed: 'improving', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 68, fatigueResistance: 58 },
      confidenceScores: { attention: 0.80, inhibition: 0.82, processingSpeed: 0.88, workingMemory: 0.80, planning: 0.78 },
      confidenceReasons: { attention: 'test', inhibition: 'test', processingSpeed: 'test', workingMemory: 'test', planning: 'test' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  }
};
const RecommendationCard = ({ item }: { item: AdaptiveRecommendationItem }) => {
  let badgeColor = '#9CA3AF';
  let badgeLabel = 'Düşük Güven';
  if (item.recommendationConfidence === 'high') { badgeColor = '#10B981'; badgeLabel = '🟢 Güçlü Öneri'; }
  else if (item.recommendationConfidence === 'medium') { badgeColor = '#F59E0B'; badgeLabel = '🟡 Ön Gözlem'; }
  else { badgeColor = '#9CA3AF'; badgeLabel = '⚪ Düşük Veri'; }

  return (
    <View style={[styles.insightCard, { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', marginBottom: 8 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={styles.insightTitle}>{item.title}</Text>
        <View style={{ backgroundColor: badgeColor + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: badgeColor }}>{badgeLabel}</Text>
        </View>
      </View>
      <Text style={styles.insightDesc}>{item.description}</Text>
      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 11, fontStyle: 'italic', color: '#6B7280' }}>💡 Neden öneriliyor? {item.rationale}</Text>
      </View>
    </View>
  );
};

export const GozcuKarnesi = ({
  childId,
  realProfile,
  realReport,
  realTrendData,
  realLongitudinalReport,
  realAdaptiveRecommendations,
  loading = false,
}: GozcuKarnesiProps) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isWide = isDesktop || isTablet;

  // Collapsible Developer Panel State
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [selectedMockKey, setSelectedMockKey] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  
  // Scalable Trend Period State
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('7d');

  // Multi-domain Trend Filter Checkboxes
  const [visibleTrendDomains, setVisibleTrendDomains] = useState<Record<string, boolean>>({
    attention: true,
    inhibition: true,
    processingSpeed: true,
    workingMemory: true,
    planning: true,
  });

  // Toggle Visibility for a domain line in the trend chart
  const toggleTrendDomain = (domainKey: string) => {
    setVisibleTrendDomains(prev => ({
      ...prev,
      [domainKey]: !prev[domainKey],
    }));
  };

  // ── 1. Memoized Profile Data Compilation ──
  const activeData = useMemo(() => {
    if (selectedMockKey && MOCK_PROFILES_DATA[selectedMockKey]) {
      const mockProfile = MOCK_PROFILES_DATA[selectedMockKey].profile;
      const mockReport = ReportEngine.generateReport(mockProfile);
      
      // Generate realistic mock trend data based on mock profile scores
      const mockTrend: TrendDataPoint[] = [];
      const days = trendPeriod === '7d' ? 7 : trendPeriod === '30d' ? 12 : 20;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        
        // Add random variance over time to mock a progressive trend
        const factor = 1 - (i * 0.02);
        mockTrend.push({
          date: label,
          attention: Math.max(0, Math.min(100, Math.round(mockProfile.currentScores.attention * factor))),
          inhibition: Math.max(0, Math.min(100, Math.round(mockProfile.currentScores.inhibition * factor))),
          processingSpeed: Math.max(0, Math.min(100, Math.round(mockProfile.currentScores.processingSpeed * factor))),
          workingMemory: Math.max(0, Math.min(100, Math.round(mockProfile.currentScores.workingMemory * factor))),
          planning: Math.max(0, Math.min(100, Math.round(mockProfile.currentScores.planning * factor))),
        });
      }

      // Generate mock longitudinal report
      const createMockSummary = (domain: keyof CognitiveDomainScores): any => ({
        direction: mockProfile.trends[domain],
        magnitude: 'moderate',
        stability: 'high',
        velocity: mockProfile.trends[domain] === 'improving' ? 1.5 : mockProfile.trends[domain] === 'declining' ? -1.5 : 0,
        scoreChange: mockProfile.trends[domain] === 'improving' ? 6 : mockProfile.trends[domain] === 'declining' ? -6 : 1,
        confidence: mockProfile.confidenceScores[domain],
        narrative: `${DOMAINS.find(d => d.key === domain)?.label} alanında performans ${mockProfile.trends[domain] === 'improving' ? 'gelişim göstermektedir' : 'dengeli seyretmektedir'}.`,
        aiEligible: true
      });

      const mockLongitudinalReport: LongitudinalReport = {
        window: trendPeriod,
        generatedAt: new Date(),
        attention: createMockSummary('attention'),
        inhibition: createMockSummary('inhibition'),
        processingSpeed: createMockSummary('processingSpeed'),
        workingMemory: createMockSummary('workingMemory'),
        planning: createMockSummary('planning'),
        overallNarrative: 'Genel bilişsel gelişim seyri, olağan beklentiler dahilinde dengeli ve istikrarlı bir şekilde devam etmektedir.'
      };

      const mockAdaptiveRecommendations = AdaptiveRecommendationEngine.generateRecommendations(mockProfile, mockLongitudinalReport);

      return {
        profile: mockProfile,
        report: mockReport,
        trendData: mockTrend,
        longitudinalReport: mockLongitudinalReport,
        adaptiveRecommendations: mockAdaptiveRecommendations,
        isMock: true,
      };
    }

    return {
      profile: realProfile,
      report: realReport,
      trendData: realTrendData,
      longitudinalReport: realLongitudinalReport,
      adaptiveRecommendations: realAdaptiveRecommendations,
      isMock: false,
    };
  }, [selectedMockKey, realProfile, realReport, realTrendData, realLongitudinalReport, realAdaptiveRecommendations, trendPeriod]);

  // AI Insight State
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  React.useEffect(() => {
    if (!activeData.profile || !activeData.report) return;
    
    let isMounted = true;
    const fetchAiInsight = async () => {
      setLoadingAi(true);
      try {
        const insight = await AIInsightService.generateInsight(
          childId,
          activeData.profile!,
          activeData.longitudinalReport,
          activeData.adaptiveRecommendations
        );
        if (isMounted) setAiInsight(insight);
      } catch (err) {
        console.log('AI Insight Fetch Error', err);
      } finally {
        if (isMounted) setLoadingAi(false);
      }
    };

    fetchAiInsight();

    return () => { isMounted = false; };
  }, [activeData.profile, activeData.longitudinalReport, activeData.adaptiveRecommendations, childId]);

  // ── 2. Onboarding / Empty State Guard ──
  const hasInsufficientData = !activeData.profile || !activeData.report || activeData.trendData.length === 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Bilişsel Rapor Hazırlanıyor...</Text>
      </View>
    );
  }

  if (hasInsufficientData) {
    return (
      <View style={styles.onboardingContainer}>
        <View style={styles.onboardingCard}>
          <Text style={styles.onboardingEmoji}>🌱</Text>
          <Text style={styles.onboardingTitle}>Bilişsel Keşif Yolculuğu Başlıyor!</Text>
          <Text style={styles.onboardingText}>
            Çocuğunuzun Gözcü Karnesi'ni ve Bilişsel Profil Detayları'nı oluşturmak için henüz yeterli veri bulunmuyor.
          </Text>
          <Text style={styles.onboardingSubtext}>
            Oyunlar oynandıkça, sistem çocuğunuzun dikkat, dürtü kontrolü, planlama ve çalışan bellek becerilerini ölçmeye başlayacaktır. 
            Güvenilir analizler için her oyundan en az birer seans tamamlanması önerilir.
          </Text>
          <View style={styles.onboardingGamesList}>
            <Text style={styles.onboardingGamesHeader}>Katkı Sağlayan Oyunlar:</Text>
            <Text style={styles.onboardingGameItem}>⚡ Yıldırım Kulesi (İşlem Hızı & Odaklanma)</Text>
            <Text style={styles.onboardingGameItem}>🌲 Dikkat Ormanı (Dürtü Kontrolü & Dikkat)</Text>
            <Text style={styles.onboardingGameItem}>💎 Kristal Tapınak (Çalışan Bellek & Görsel Takip)</Text>
            <Text style={styles.onboardingGameItem}>🗺️ Hazine Haritası (Stratejik Planlama & Yürütücü İşlev)</Text>
          </View>
        </View>

        {/* Developer panel is still accessible even in empty onboarding state for verification */}
        {renderDeveloperPanel()}
      </View>
    );
  }

  const profile = activeData.profile!;
  const report = activeData.report!;
  const trendData = activeData.trendData;

  // ── Explainability & Sufficiency Helpers ──
  const getDomainDataSufficiency = (domainKey: keyof CognitiveDomainScores) => {
    if (selectedMockKey) {
      switch (selectedMockKey) {
        case 'high': return { sessions: 24, minutes: 120 };
        case 'mixed': return { sessions: 15, minutes: 75 };
        case 'low_confidence': return { sessions: 3, minutes: 15 };
        case 'strong_planner': return { sessions: 18, minutes: 90 };
        case 'fast_impulsive': return { sessions: 20, minutes: 100 };
        default: return { sessions: 10, minutes: 50 };
      }
    }
    const sessions = realTrendData.length;
    const minutes = sessions * 5;
    return { sessions, minutes };
  };

  const getExplainabilityBulletPoints = (domainKey: keyof CognitiveDomainScores): string[] => {
    switch (domainKey) {
      case 'attention':
        return [
          'Seçici Dikkat Doğruluğu (Hedef nesneleri doğru seçebilme)',
          'Sürdürülebilir Dikkat İstikrarı (Süreç boyunca odağı koruyabilme)',
          'Çeldirici Direnci (Gereksiz uyarılara takılmama)'
        ];
      case 'inhibition':
        return [
          'Hatalı Başlangıç Oranı (Acele etmeden doğru zamanı bekleme)',
          'Gecikme Toleransı (Sakin ve kontrollü tepkiler verebilme)',
          'Tepki Süresi Dalgalanması (Kararlı bir ritimde ilerleyebilme)'
        ];
      case 'processingSpeed':
        return [
          'Görsel Tarama Hızı (Ekrana gelen uyaranları hızlı algılama)',
          'Hedef Reaksiyon Süresi (Fark eder etmez eyleme geçme hızı)',
          'Motor Tepki Hızı (Fiziksel tıklama/dokunma refleks süresi)'
        ];
      case 'workingMemory':
        return [
          'Hafıza Uzamı Genişliği (Akılda tutulabilen maksimum adım sayısı)',
          'Mekansal Desen Doğruluğu (Konumları zihinde doğru eşleyebilme)',
          'Sıralı Hatırlama Hızı (Görselleri sırasıyla geri çağırabilme)'
        ];
      case 'planning':
        return [
          'Görev öncesi strateji oluşturma (Harekete geçmeden önce düşünme)',
          'Hedefe ulaşmak için izlenen rota (Adımları en verimli şekilde belirleme)',
          'Gereksiz yön değişiklikleri (Kararsız veya plansız hareket etmeme)',
          'Planı güncelleme davranışları (Engeller karşısında esnek düşünebilme)'
        ];
      default:
        return [];
    }
  };

  const getDeveloperTelemetryKeys = (domainKey: keyof CognitiveDomainScores): string[] => {
    switch (domainKey) {
      case 'attention':
        return ['attentionScore', 'hits', 'misses'];
      case 'inhibition':
        return ['falseStarts', 'correctResponses', 'reactionTimeVariance'];
      case 'processingSpeed':
        return ['reactionTimeMedian', 'correctResponses', 'missedStimuli'];
      case 'workingMemory':
        return ['maxSpanReached', 'retrievalAccuracy', 'sequenceLengthHistory'];
      case 'planning':
        return ['planningScore', 'efficiencyScore', 'deadEnds', 'replanningEvents'];
      default:
        return [];
    }
  };

  // ── Helper functions for badges ──
  const getTrendBadge = (trend?: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return { text: '📈 Gelişiyor', color: '#10B981', bg: '#D1FAE5' };
      case 'declining':
        return { text: '📉 Daha Fazla Veri İzleniyor', color: '#F59E0B', bg: '#FEF3C7' };
      case 'stable':
      default:
        return { text: '➡️ Dengeli', color: '#3B82F6', bg: '#DBEAFE' };
    }
  };

  const getConfidenceBadge = (confidence?: number) => {
    const val = confidence ?? 0;
    if (val >= 0.7) return { text: 'Yüksek Güven', color: '#10B981', bg: '#D1FAE5', icon: '🟢' };
    if (val >= 0.4) return { text: 'Orta Güven', color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' };
    return { text: 'Daha Fazla Veri Gerekli', color: '#9CA3AF', bg: '#F3F4F6', icon: '⚪' };
  };

  // ── SVG Radar Chart Layout Helper ──
  const radarWidth = 280;
  const radarHeight = 280;
  const cx = radarWidth / 2;
  const cy = radarHeight / 2;
  const maxRadius = 90;

  const radarPoints = DOMAINS.map((d, i) => {
    const score = profile.currentScores[d.key] || 0;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const r = (score / 100) * maxRadius;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    
    // Label coordinate slightly outward
    const lx = cx + (maxRadius + 22) * Math.cos(angle);
    const ly = cy + (maxRadius + 14) * Math.sin(angle);

    return { px, py, lx, ly, label: d.label, color: d.color };
  });

  const pointsString = radarPoints.map(p => `${p.px},${p.py}`).join(' ');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* ── Section 1: Gözcü Özeti ── */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>🦉 Gözcü Rapor Özeti</Text>
          {selectedMockKey && <Text style={styles.demoLabel}>Demo Modu</Text>}
        </View>
        <Text style={styles.summaryContent}>{report.overallNarrative}</Text>

        {/* Beta Analysis Notice for real data */}
        {!selectedMockKey && (
          <View style={styles.betaNoticeContainer}>
            <Text style={styles.betaNoticeText}>
              Bu profil mevcut oyun verilerine dayalı davranışsal tahminlerden oluşturulmuştur. Yeni oyun oturumları tamamlandıkça doğruluk artacaktır.
            </Text>
          </View>
        )}
      </View>

      {/* ── Section 1.5: Yapay Zeka İçgörüleri ── */}
      {aiInsight && (
        <View style={[styles.sectionCard, { backgroundColor: aiInsight.isFallback ? '#F3F4F6' : '#F0FDF4', borderColor: aiInsight.isFallback ? '#D1D5DB' : '#BBF7D0' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={styles.cardTitle}>🤖 Yapay Zeka İçgörüleri</Text>
              <Text style={styles.cardSubtitle}>Kapsamlı oyun verilerinizin pedagojik analizi</Text>
            </View>
            <View style={{ backgroundColor: aiInsight.isFallback ? '#6B7280' : '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{aiInsight.sourceBadge}</Text>
            </View>
          </View>
          
          {loadingAi ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <View style={{ gap: 12 }}>
              {(() => {
                try {
                  const data = JSON.parse(aiInsight.narrative);
                  return (
                    <>
                      <View style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontWeight: 'bold', color: '#4B5563', marginBottom: 4 }}>👀 Gözlemler</Text>
                        <Text style={{ color: '#374151', lineHeight: 20 }}>{data['Gözlemler']}</Text>
                      </View>
                      <View style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontWeight: 'bold', color: '#10B981', marginBottom: 4 }}>⭐ Güçlü Alanlar</Text>
                        <Text style={{ color: '#374151', lineHeight: 20 }}>{data['Güçlü Alanlar']}</Text>
                      </View>
                      <View style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontWeight: 'bold', color: '#F59E0B', marginBottom: 4 }}>🌱 Desteklenebilecek Alanlar</Text>
                        <Text style={{ color: '#374151', lineHeight: 20 }}>{data['Desteklenebilecek Alanlar']}</Text>
                      </View>
                      <View style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontWeight: 'bold', color: '#6366F1', marginBottom: 4 }}>🎯 Öneriler</Text>
                        <Text style={{ color: '#374151', lineHeight: 20 }}>{data['Öneriler']}</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'right', marginTop: 4 }}>
                        Powered by {aiInsight.provider} (v{aiInsight.promptVersion})
                      </Text>
                    </>
                  );
                } catch (e) {
                  return <Text style={{ color: '#6B7280' }}>Veri formatlanırken bir sorun oluştu.</Text>;
                }
              })()}
            </View>
          )}
        </View>
      )}

      {/* ── Section 2: Cognitive Profile Overview (Radar & Domain Cards) ── */}
      <View style={[styles.sectionRow, isWide && styles.sectionRowWide]}>
        
        {/* Radar Chart Visual Container */}
        <View style={styles.radarCard}>
          <Text style={styles.cardTitle}>Bilişsel Keşif Profili</Text>
          <Text style={styles.cardSubtitle}>Oyun bazlı davranışsal analiz haritası</Text>
          
          <View style={styles.radarWrapper}>
            <Svg width={radarWidth} height={radarHeight}>
              <G>
                {/* Draw 4 nested pentagon grid boundaries */}
                {[0.25, 0.5, 0.75, 1.0].map((scale, gridIdx) => {
                  const r = scale * maxRadius;
                  const pentagonPoints = DOMAINS.map((_, i) => {
                    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                    const px = cx + r * Math.cos(angle);
                    const py = cy + r * Math.sin(angle);
                    return `${px},${py}`;
                  }).join(' ');

                  return (
                    <Polygon
                      key={gridIdx}
                      points={pentagonPoints}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Draw 5 Radial spoke lines */}
                {DOMAINS.map((_, i) => {
                  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                  const px = cx + maxRadius * Math.cos(angle);
                  const py = cy + maxRadius * Math.sin(angle);
                  return (
                    <Line
                      key={i}
                      x1={cx}
                      y1={cy}
                      x2={px}
                      y2={py}
                      stroke="#E5E7EB"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Shaded Profile Polygon representing the actual child scores */}
                <Polygon
                  points={pointsString}
                  fill="rgba(99, 102, 241, 0.18)"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                />

                {/* Circle marker dots on each active vertex */}
                {radarPoints.map((p, i) => (
                  <Circle
                    key={i}
                    cx={p.px}
                    cy={p.py}
                    r="5"
                    fill={p.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                ))}

                {/* SVG Text Labels for 5 Domains */}
                {radarPoints.map((p, i) => (
                  <SvgText
                    key={i}
                    x={p.lx}
                    y={p.ly}
                    fontSize="11"
                    fontWeight="800"
                    fill="#4B5563"
                    textAnchor="middle"
                  >
                    {p.label}
                  </SvgText>
                ))}
              </G>
            </Svg>
          </View>

          {/* Radar Interpretation Zones Legend */}
          <View style={styles.radarInterpretationRow}>
            <View style={styles.radarInterpretationItem}>
              <View style={[styles.radarInterpretationDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.radarInterpretationLabel}>Başlangıç Seviyesi</Text>
            </View>
            <View style={styles.radarInterpretationItem}>
              <View style={[styles.radarInterpretationDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.radarInterpretationLabel}>Gelişim Aşamasında</Text>
            </View>
            <View style={styles.radarInterpretationItem}>
              <View style={[styles.radarInterpretationDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.radarInterpretationLabel}>Yerleşen Beceri</Text>
            </View>
            <View style={styles.radarInterpretationItem}>
              <View style={[styles.radarInterpretationDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.radarInterpretationLabel}>Belirgin Güçlü Alan</Text>
            </View>
          </View>
        </View>

        {/* Side-by-side Domain Detail Cards */}
        <View style={styles.domainCardsColumn}>
          {DOMAINS.map(d => {
            const score = profile.currentScores[d.key] || 0;
            const trend = getTrendBadge(profile.trends[d.key]);
            const conf = getConfidenceBadge(profile.confidenceScores[d.key]);
            const sufficiency = getDomainDataSufficiency(d.key);
            const isExpanded = expandedDomain === d.key;

            return (
              <View key={d.key} style={styles.domainDetailCard}>
                <Pressable onPress={() => setExpandedDomain(isExpanded ? null : d.key)}>
                  <View style={styles.domainCardHeader}>
                    <View style={styles.domainTitleRow}>
                      <Text style={styles.domainIcon}>{d.icon}</Text>
                      <Text style={styles.domainName}>{d.label}</Text>
                    </View>
                    <Text style={[styles.domainScore, { color: d.color }]}>{Math.round(score)}</Text>
                  </View>
                  
                  <View style={styles.domainBadgeRow}>
                    <View style={[styles.badgeContainer, { backgroundColor: trend.bg }]}>
                      <Text style={[styles.badgeText, { color: trend.color }]}>{trend.text}</Text>
                    </View>
                    
                    <View style={[styles.badgeContainer, { backgroundColor: conf.bg }]}>
                      <Text style={[styles.badgeText, { color: conf.color }]}>
                        {conf.icon} {conf.text} (%{Math.round((profile.confidenceScores[d.key] ?? 0) * 100)})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.domainSufficiencyRow}>
                    <Text style={styles.domainSufficiencyText}>
                      Veri Kaynağı: {sufficiency.sessions} oturum | {sufficiency.minutes} dakika
                    </Text>
                    <Text style={[styles.expandToggleLabel, { color: d.color }]}>
                      {isExpanded ? 'Detayları Gizle ▲' : 'Detayları Göster ▼'}
                    </Text>
                  </View>
                </Pressable>

                {isExpanded && (
                  <View style={styles.explainabilityContainer}>
                    <Text style={styles.explainTitle}>Değerlendirilen Beceriler:</Text>
                    {getExplainabilityBulletPoints(d.key).map((bullet, bIdx) => (
                      <Text key={bIdx} style={styles.explainBullet}>
                        • {bullet}
                      </Text>
                    ))}

                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.explainTitle, { color: '#6366F1' }]}>🔍 Neden Bu Güven Skoru?</Text>
                      <Text style={styles.explainBullet}>{profile.confidenceReasons[d.key]}</Text>
                    </View>

                    {profile.aiEligibility[d.key] ? (
                      <View style={{ marginTop: 12, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#059669', fontWeight: 'bold' }}>✅ Gerçek Oyun Verisi / Yüksek Kalite Telemetri</Text>
                      </View>
                    ) : (
                      <View style={{ marginTop: 12, backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: 'bold' }}>⚠️ Doğrulanmamış Veri / Yapay Zeka Analizine Uygun Değil</Text>
                      </View>
                    )}

                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.explainTitle, { color: '#10B981' }]}>📊 AI İçgörü Verisi:</Text>
                      {profile.evidence[d.key].map((ev, eIdx) => (
                        <Text key={eIdx} style={styles.explainBullet}>
                          • {ev}
                        </Text>
                      ))}
                    </View>

                    {!profile.aiEligibility[d.key] && (
                      <View style={{ marginTop: 12, backgroundColor: '#FEF2F2', padding: 8, borderRadius: 6 }}>
                        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
                          ⚠️ Yapay Zeka Analizine Uygun Değil (Geçmiş / Sentetik Veri)
                        </Text>
                      </View>
                    )}

                    {/* Developer Telemetry visible in Mock/Dev mode */}
                    {activeData.isMock && (
                      <View style={styles.developerTelemetryContainer}>
                        <Text style={styles.devTelemetryTitle}>🛠️ Geliştirici Telemetrisi:</Text>
                        <Text style={styles.devTelemetryCode}>
                          {getDeveloperTelemetryKeys(d.key).join('\n')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

      </View>

      {/* ── Section 3: Gelişim Yolculuğu ── */}
      {activeData.longitudinalReport && (
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>🧭 Gelişim Yolculuğu ({activeData.longitudinalReport.window})</Text>
          <Text style={styles.cardSubtitle}>{activeData.longitudinalReport.overallNarrative}</Text>
          <View style={styles.insightsGrid}>
            {DOMAINS.map((d, idx) => {
              const domainSummary = activeData.longitudinalReport![d.key];
              if (!domainSummary) return null;
              
              let dirEmoji = '➡️';
              let dirColor = '#6B7280';
              if (domainSummary.direction === 'improving') { dirEmoji = '📈'; dirColor = '#10B981'; }
              if (domainSummary.direction === 'plateau') { dirEmoji = '📊'; dirColor = '#3B82F6'; }
              if (domainSummary.direction === 'declining') { dirEmoji = '📉'; dirColor = '#F59E0B'; }

              return (
                <View key={idx} style={[styles.insightCard, { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }]}>
                  <View style={styles.insightHeader}>
                    <Text style={{ fontSize: 20 }}>{dirEmoji}</Text>
                    <Text style={[styles.insightTitle, { color: dirColor }]}>{d.label}</Text>
                  </View>
                  <Text style={styles.insightDesc}>{domainSummary.narrative}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Section 4: Güçlü Alanlar ── */}
      {report.strengths.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>⭐ Güçlü Alanlar</Text>
          <Text style={styles.cardSubtitle}>Yüksek potansiyele sahip gözlemlenen beceriler</Text>
          <View style={styles.insightsGrid}>
            {report.strengths.map((s, idx) => (
              <View key={idx} style={[styles.insightCard, styles.strengthInsightCard]}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightEmoji}>⭐</Text>
                  <Text style={styles.insightTitle}>{s.title}</Text>
                </View>
                <Text style={styles.insightDesc}>{s.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Section 5: Gelişim Fırsatları ── */}
      {report.growthAreas.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>🌱 Gelişim Fırsatları</Text>
          <Text style={styles.cardSubtitle}>Desteklenebilecek ve güçlendirilebilecek alanlar</Text>
          <View style={styles.insightsGrid}>
            {report.growthAreas.map((g, idx) => (
              <View key={idx} style={[styles.insightCard, styles.growthInsightCard]}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightEmoji}>🌱</Text>
                  <Text style={styles.insightTitle}>{g.title}</Text>
                </View>
                <Text style={styles.insightDesc}>{g.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Section 6: Kişiselleştirilmiş Öneriler ── */}
      {activeData.adaptiveRecommendations && activeData.adaptiveRecommendations.recommendations.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>🎯 Kişiselleştirilmiş Öneriler</Text>
          <Text style={styles.cardSubtitle}>Mevcut verilere dayalı, çocuğunuzun gelişimini destekleyecek güvenilir aksiyonlar</Text>
          
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#4F46E5' }}>📅 Oyun Planı</Text>
            {activeData.adaptiveRecommendations.recommendations.filter(r => r.category === 'session').map(r => (
               <RecommendationCard key={r.id} item={r} />
            ))}
          </View>
          
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#4F46E5' }}>🎮 Önerilen Oyunlar</Text>
            {activeData.adaptiveRecommendations.recommendations.filter(r => r.category === 'game').map(r => (
               <RecommendationCard key={r.id} item={r} />
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#4F46E5' }}>🏠 Ebeveyn & Ev Etkinlikleri</Text>
            {activeData.adaptiveRecommendations.recommendations.filter(r => r.category === 'home_activity' || r.category === 'daily_routine').map(r => (
               <RecommendationCard key={r.id} item={r} />
            ))}
          </View>
        </View>
      )}

      {/* ── Section 7: Trend Tracking (Scalable Trend Chart) ── */}
      <View style={styles.sectionCard}>
        <View style={styles.trendHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>📈 Performans Trendi</Text>
            <Text style={styles.cardSubtitle}>Bilişsel alanların zaman içerisindeki değişimi</Text>
          </View>
          
          {/* Trend Period Selector */}
          <View style={styles.periodSelector}>
            {(['7d', '30d', '90d'] as TrendPeriod[]).map(p => (
              <Pressable
                key={p}
                onPress={() => setTrendPeriod(p)}
                style={[styles.periodBtn, trendPeriod === p && styles.periodBtnActive]}
              >
                <Text style={[styles.periodBtnText, trendPeriod === p && styles.periodBtnTextActive]}>
                  {p === '7d' ? '7 Gün' : p === '30d' ? '30 Gün' : '90 Gün'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom SVG Line Chart representation */}
        <View style={styles.trendChartContainer}>
          {trendData.length < 2 ? (
            <View style={styles.emptyTrendBox}>
              <Text style={styles.emptyTrendText}>
                Trend çizgisini görüntülemek için en az iki farklı günde oyun tamamlanmalıdır.
              </Text>
            </View>
          ) : (
            <View>
              {/* SVG Line Chart */}
              <View style={styles.chartWrapper}>
                <Svg width="100%" height="200" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[50, 100, 150].map((yVal, idx) => (
                    <Line
                      key={idx}
                      x1="0"
                      y1={yVal}
                      x2="500"
                      y2={yVal}
                      stroke="#F3F4F6"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Draw Lines for each selected domain */}
                  {DOMAINS.map(d => {
                    if (!visibleTrendDomains[d.key]) return null;

                    // Compute points coordinates
                    const points = trendData.map((pt, idx) => {
                      const x = (idx / (trendData.length - 1)) * 480 + 10;
                      // Invert Y axis: score 100 is at y=10, score 0 is at y=190
                      const score = (pt[d.key] as number) || 0;
                      const y = 190 - (score / 100) * 180;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <Polyline
                        key={d.key}
                        points={points}
                        fill="none"
                        stroke={d.color}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </Svg>
              </View>

              {/* X-Axis labels */}
              <View style={styles.xAxisRow}>
                {trendData.map((pt, idx) => {
                  // Only show up to 5 labels to prevent cluttering
                  const step = Math.ceil(trendData.length / 5);
                  if (idx % step !== 0 && idx !== trendData.length - 1) return null;
                  return (
                    <Text key={idx} style={styles.xAxisLabel}>
                      {pt.date}
                    </Text>
                  );
                })}
              </View>

              {/* Domain Selectors / Checkboxes */}
              <View style={styles.chartLegendContainer}>
                {DOMAINS.map(d => {
                  const isVisible = visibleTrendDomains[d.key];
                  return (
                    <Pressable
                      key={d.key}
                      onPress={() => toggleTrendDomain(d.key)}
                      style={[
                        styles.legendItem,
                        isVisible && { borderColor: d.color, backgroundColor: d.color + '10' }
                      ]}
                    >
                      <View style={[styles.legendIndicator, { backgroundColor: isVisible ? d.color : '#E5E7EB' }]} />
                      <Text style={[styles.legendText, isVisible && { color: '#1F2937', fontWeight: '800' }]}>
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── Section 6: Güvenilirlik Seviyesi (Global Summary) ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>🛡️ Analiz Güvenilirlik Durumu</Text>
        <Text style={styles.cardSubtitle}>Sistemin sunduğu çıkarımların veri doluluğu analizi</Text>
        
        <View style={styles.confidenceRow}>
          <View style={styles.confidenceGaugeContainer}>
            <View style={styles.confidencePercentageCircle}>
              <Text style={styles.confidencePercentText}>
                %{Math.round(report.confidenceSummary.overallConfidence * 100)}
              </Text>
              <Text style={styles.confidencePercentSub}>Ortalama Güven</Text>
            </View>
          </View>
          
          <View style={styles.confidenceInfoBlock}>
            <Text style={styles.confidenceStatusTitle}>
              {getConfidenceBadge(report.confidenceSummary.overallConfidence).text}
            </Text>
            <Text style={styles.confidenceStatusDesc}>
              {report.confidenceSummary.message}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Section 7: Oyun Katkı Analizi ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>🎮 Oyun Katkı Analizi</Text>
        <Text style={styles.cardSubtitle}>Hangi oyunun hangi bilişsel alanı eğittiğini keşfedin</Text>
        
        <View style={styles.gamesBreakdownGrid}>
          <View style={styles.gameContributionBox}>
            <Text style={styles.gameContribIcon}>⚡</Text>
            <Text style={styles.gameContribTitle}>Yıldırım Kulesi</Text>
            <View style={styles.contribDomainBadge}>
              <Text style={styles.contribBadgeText}>⚡ İşlem Hızı</Text>
            </View>
            <View style={styles.contribDomainBadge}>
              <Text style={styles.contribBadgeText}>🎯 Dikkat</Text>
            </View>
          </View>

          <View style={styles.gameContributionBox}>
            <Text style={styles.gameContribIcon}>🌲</Text>
            <Text style={styles.gameContribTitle}>Dikkat Ormanı</Text>
            <View style={styles.contribDomainBadge}>
              <Text style={styles.contribBadgeText}>🛑 Dürtü Kontrolü</Text>
            </View>
            <View style={styles.contribDomainBadge}>
              <Text style={styles.contribBadgeText}>🎯 Dikkat</Text>
            </View>
          </View>

          <View style={styles.gameContributionBox}>
            <Text style={styles.gameContribIcon}>💎</Text>
            <Text style={styles.gameContribTitle}>Kristal Tapınak</Text>
            <View style={styles.contribDomainBadge}>
              <Text style={styles.contribBadgeText}>🧠 Çalışan Bellek</Text>
            </View>
          </View>

          <View style={styles.gameContributionBox}>
            <Text style={styles.gameContribIcon}>🗺️</Text>
            <Text style={styles.gameContribTitle}>Hazine Haritası</Text>
            <View style={styles.contribDomainBadge}>
              <Text style={styles.contribBadgeText}>🧭 Planlama</Text>
            </View>
            <View style={styles.contribDomainBadge}>
              <Text style={styles.contribBadgeText}>🧠 Çalışan Bellek</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Section 8: Collapsible Developer Demo Mode Panel ── */}
      {renderDeveloperPanel()}

    </ScrollView>
  );

  function renderDeveloperPanel() {
    return (
      <View style={styles.demoPanel}>
        <Pressable
          onPress={() => setShowDemoPanel(!showDemoPanel)}
          style={styles.demoPanelHeader}
        >
          <Text style={styles.demoPanelTitle}>🛠️ Geliştirici Demo Modu (Mock Profil Seçici)</Text>
          <Text style={styles.demoPanelToggleText}>
            {showDemoPanel ? 'Gizle ▲' : 'Göster ▼'}
          </Text>
        </Pressable>

        {showDemoPanel && (
          <View style={styles.demoPanelContent}>
            <Text style={styles.demoPanelDesc}>
              Farklı bilişsel kombinasyonları, radar grafiklerini ve raporları test etmek için bir profil seçin.
            </Text>
            <View style={styles.demoButtonsContainer}>
              <Pressable
                onPress={() => setSelectedMockKey(null)}
                style={[styles.demoBtn, !selectedMockKey && styles.demoBtnActive]}
              >
                <Text style={[styles.demoBtnText, !selectedMockKey && styles.demoBtnTextActive]}>
                  Real Data (Mevcut Profil)
                </Text>
              </Pressable>
              
              {Object.keys(MOCK_PROFILES_DATA).map(key => (
                <Pressable
                  key={key}
                  onPress={() => setSelectedMockKey(key)}
                  style={[styles.demoBtn, selectedMockKey === key && styles.demoBtnActive]}
                >
                  <Text style={[styles.demoBtnText, selectedMockKey === key && styles.demoBtnTextActive]}>
                    {MOCK_PROFILES_DATA[key].label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    gap: 24,
  },
  loadingContainer: {
    padding: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  
  // ── Onboarding / Empty State ──
  onboardingContainer: {
    gap: 24,
  },
  onboardingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  onboardingEmoji: {
    fontSize: 48,
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },
  onboardingText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
    maxWidth: 500,
  },
  onboardingSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 550,
  },
  onboardingGamesList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    gap: 8,
    marginTop: 8,
  },
  onboardingGamesHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  onboardingGameItem: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },

  // ── Section 1: Gözcü Özeti ──
  summaryCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 24,
    gap: 12,
  },
  betaNoticeContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 12,
    marginTop: 8,
  },
  betaNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
    fontWeight: '600',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D97706',
  },
  demoLabel: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  summaryContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#78350F',
    fontWeight: '600',
  },

  // ── Section 2: Cognitive Profile Overview ──
  sectionRow: {
    gap: 24,
    flexDirection: 'column',
  },
  sectionRowWide: {
    flexDirection: 'row',
  },
  radarCard: {
    flex: 1.1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInterpretationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  radarInterpretationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radarInterpretationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radarInterpretationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 16,
  },
  radarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainCardsColumn: {
    flex: 1,
    gap: 12,
  },
  domainDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 10,
  },
  domainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  domainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainIcon: {
    fontSize: 18,
  },
  domainName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  domainScore: {
    fontSize: 20,
    fontWeight: '900',
  },
  domainBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  domainSufficiencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  domainSufficiencyText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  expandToggleLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  explainabilityContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  explainTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  explainBullet: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    fontWeight: '600',
  },
  developerTelemetryContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 8,
    gap: 4,
    marginTop: 4,
  },
  devTelemetryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  devTelemetryCode: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#38BDF8',
    lineHeight: 14,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Sections 3 & 4: Insights (Strengths/Growth) ──
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
  },
  insightsGrid: {
    gap: 12,
    marginTop: 12,
  },
  insightCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  strengthInsightCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  growthInsightCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightEmoji: {
    fontSize: 16,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  insightDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    fontWeight: '500',
  },

  // ── Section 5: Trend Tracking ──
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  periodBtnTextActive: {
    color: '#111827',
  },
  trendChartContainer: {
    marginTop: 16,
    gap: 12,
  },
  emptyTrendBox: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyTrendText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  chartWrapper: {
    height: 200,
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  xAxisLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  chartLegendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  // ── Section 6: Confidence Level ──
  confidenceRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  confidenceGaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidencePercentageCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  confidencePercentText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#065F46',
  },
  confidencePercentSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#047857',
    textTransform: 'uppercase',
  },
  confidenceInfoBlock: {
    flex: 1,
    gap: 4,
    minWidth: 200,
  },
  confidenceStatusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  confidenceStatusDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    fontWeight: '500',
  },

  // ── Section 7: Games Breakdown ──
  gamesBreakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  gameContributionBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  gameContribIcon: {
    fontSize: 24,
  },
  gameContribTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  contribDomainBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  contribBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },

  // ── Collapsible Developer Panel ──
  demoPanel: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  demoPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#0F172A',
  },
  demoPanelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  demoPanelToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  demoPanelContent: {
    padding: 16,
    gap: 12,
  },
  demoPanelDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  demoButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  demoBtnActive: {
    backgroundColor: '#2563EB',
  },
  demoBtnText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  demoBtnTextActive: {
    color: '#FFFFFF',
  },
});
