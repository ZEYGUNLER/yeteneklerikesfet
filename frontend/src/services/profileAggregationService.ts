import { analyticsService } from './analytics.service';
import { CognitiveScoringEngine, CognitiveProfile, GameSessionPayload } from './cognitiveScoringEngine';
import { ReportEngine, ParentInsightReport } from './reportEngine';
import { planningTelemetryValidator } from './planningTelemetryValidator';
import { LongitudinalAnalysisEngine, LongitudinalReport } from './longitudinalAnalysisEngine';
import { AdaptiveRecommendationEngine, AdaptiveRecommendationReport } from './adaptiveRecommendationEngine';

export type TrendPeriod = '7d' | '30d' | '90d';

export interface TrendDataPoint {
  date: string;
  attention: number;
  inhibition: number;
  processingSpeed: number;
  workingMemory: number;
  planning: number;
}

export interface AggregateProfileReport {
  profile: CognitiveProfile;
  report: ParentInsightReport;
  trendData: TrendDataPoint[];
  longitudinalReport: LongitudinalReport;
  adaptiveRecommendations: AdaptiveRecommendationReport;
}

export class ProfileAggregationService {
  /**
   * Fetches raw progress data and compiles it into a unified cognitive profile,
   * report insights, and trend data over a specified period.
   */
  public static async getAggregateReport(
    childId: string,
    period: TrendPeriod = '7d'
  ): Promise<AggregateProfileReport | null> {
    try {
      // 1. Fetch raw progress reports from database
      const progressResponse = await analyticsService.getProgress(childId);
      const reports = progressResponse.data || [];

      if (!Array.isArray(reports) || reports.length === 0) {
        return null;
      }

      const planningSessionsResponse = await analyticsService.getPlanningSessions(childId);
      const planningSessions = planningSessionsResponse.data || [];

      // 2. Synthesize GameSessionPayloads from legacy Progress Reports and append real planning sessions
      const sessions = this.mapReportsToSessions(reports, planningSessions);

      // 3. Compile Cognitive Profile
      const profile = CognitiveScoringEngine.compileProfile(sessions);

      // 4. Generate Parent Insight Report
      const report = ReportEngine.generateReport(profile);

      // 5. Generate scalable trend data based on selected period
      const trendData = this.generateTrendHistory(reports, period);

      // 6. Generate Longitudinal Development Report
      const longitudinalReport = LongitudinalAnalysisEngine.analyzeDevelopment(sessions, period, profile);

      // 7. Generate Adaptive Recommendations
      const adaptiveRecommendations = AdaptiveRecommendationEngine.generateRecommendations(profile, longitudinalReport);

      return {
        profile,
        report,
        trendData,
        longitudinalReport,
        adaptiveRecommendations,
      };
    } catch (e) {
      console.error('[ProfileAggregationService] Error aggregating profile:', e);
      return null;
    }
  }

  /**
   * Maps progress reports from the API into synthetic GameSessionPayloads
   * that can be processed by the CognitiveScoringEngine.
   */
  public static mapReportsToSessions(reports: any[], realPlanningSessions: GameSessionPayload[] = []): GameSessionPayload[] {
    const mappedPlanningSessions = realPlanningSessions.map(s => {
      // Legacy or missing telemetry
      if (!s.metadata?.planning) {
        return { ...s, metadata: { ...s.metadata, source: 'proxy' }, telemetryVerified: false, telemetryQuality: 'low' as const };
      }

      const validation = planningTelemetryValidator.verifyTelemetry(s.metadata.planning);
      if (!validation.valid) {
        return { ...s, metadata: { ...s.metadata, source: 'proxy' }, telemetryVerified: false, telemetryQuality: 'low' as const };
      }

      return {
        ...s,
        metadata: { ...s.metadata, source: 'telemetry' },
        telemetryVerified: true,
        telemetryQuality: validation.quality
      };
    });

    const sessions: GameSessionPayload[] = [...mappedPlanningSessions];

    reports.forEach((r, index) => {
      const timestamp = r.createdAt || r.date || new Date().toISOString();
      const dateObj = new Date(timestamp);
      
      // We assume each report contains memory, attention, logic scores
      const attentionScore = Number(r.attention ?? 50);
      const memoryScore = Number(r.memory ?? 50);
      const logicScore = Number(r.logic ?? 50);

      // We space sessions slightly in time to preserve chronological ordering
      const timeOffset = index * 1000;

      // 1. Attention Game Session
      sessions.push({
        gameId: 'attention',
        score: attentionScore,
        accuracy: attentionScore / 100,
        duration: 300,
        createdAt: new Date(dateObj.getTime() + timeOffset).toISOString(),
        metadata: {
          attentionScore,
          attentionRecoveryRate: attentionScore,
          hits: Math.round(attentionScore * 0.08),
          misses: Math.max(0, 8 - Math.round(attentionScore * 0.08)),
        },
      });

      // 2. Reaction/Logic Session
      sessions.push({
        gameId: 'reaction',
        score: logicScore,
        accuracy: logicScore / 100,
        duration: 300,
        createdAt: new Date(dateObj.getTime() + timeOffset + 10).toISOString(),
        metadata: {
          reactionTimeMedian: 550 - (logicScore - 50) * 2,
          correctResponses: Math.round(logicScore * 0.24),
          missedStimuli: Math.max(0, 24 - Math.round(logicScore * 0.24)),
          falseStarts: Math.max(0, 5 - Math.round(logicScore * 0.05)),
        },
      });

      // 3. Memory Session
      sessions.push({
        gameId: 'pattern_memory',
        score: memoryScore,
        accuracy: memoryScore / 100,
        duration: 300,
        createdAt: new Date(dateObj.getTime() + timeOffset + 20).toISOString(),
        metadata: {
          maxSpanReached: 3 + Math.floor(memoryScore / 20),
          retrievalAccuracy: memoryScore / 100,
          sequenceLengthHistory: Array(24).fill(0),
        },
      });

      // 4. Legacy Planning Proxy (Flagged)
      // Historical proxy scores are generated so old data doesn't break, but marked to prevent AI contamination.
      const planningScore = Math.round((memoryScore * 0.6) + (logicScore * 0.4));
      sessions.push({
        gameId: 'planning',
        score: planningScore,
        accuracy: planningScore / 100,
        duration: 300,
        createdAt: new Date(dateObj.getTime() + timeOffset + 30).toISOString(),
        metadata: {
          source: 'proxy',
          planningScore,
          efficiencyScore: planningScore / 100,
          deadEndsVisited: Math.max(0, 5 - Math.round(planningScore * 0.05)),
          replanningEvents: Math.max(0, 4 - Math.round(planningScore * 0.04)),
        },
      });
    });

    return sessions;
  }

  /**
   * Generates a list of data points representing the cognitive scores trend
   * over the selected period ('7d' | '30d' | '90d').
   */
  private static generateTrendHistory(reports: any[], period: TrendPeriod): TrendDataPoint[] {
    const sorted = [...reports].sort((a, b) => {
      const da = new Date(a.createdAt || a.date).getTime();
      const db = new Date(b.createdAt || b.date).getTime();
      return da - db;
    });

    const now = Date.now();
    let daysToFilter = 7;
    if (period === '30d') daysToFilter = 30;
    else if (period === '90d') daysToFilter = 90;

    const limitTime = now - daysToFilter * 24 * 60 * 60 * 1000;

    const filtered = sorted.filter(r => {
      const t = new Date(r.createdAt || r.date).getTime();
      return t >= limitTime;
    });

    // If no reports fit the time window, fallback to showing whatever reports are available
    const activeReports = filtered.length > 0 ? filtered : sorted;

    const trendPoints: TrendDataPoint[] = [];

    // Calculate rolling cognitive profiles cumulatively to show a true progression trend
    for (let i = 0; i < activeReports.length; i++) {
      const reportsSubset = activeReports.slice(0, i + 1);
      const subSessions = this.mapReportsToSessions(reportsSubset, []);
      const subProfile = CognitiveScoringEngine.compileProfile(subSessions);
      
      const rawDate = activeReports[i].createdAt || activeReports[i].date || new Date().toISOString();
      const formattedDate = new Date(rawDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

      trendPoints.push({
        date: formattedDate,
        attention: subProfile.currentScores.attention,
        inhibition: subProfile.currentScores.inhibition,
        processingSpeed: subProfile.currentScores.processingSpeed,
        workingMemory: subProfile.currentScores.workingMemory,
        planning: subProfile.currentScores.planning,
      });
    }

    return trendPoints;
  }
}
