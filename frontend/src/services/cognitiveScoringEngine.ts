import { FatigueEngine, FatigueMetricsInput } from './fatigueEngine';
import { PLANNING_WEIGHTS } from './planningWeights';
import { PlanningTelemetry } from './planningTelemetry';/**
 * Standard game completion payload as received from the services.
 */
export interface GameSessionPayload {
  gameId: string;
  score: number;
  accuracy: number;
  duration?: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  telemetryVerified?: boolean;
  telemetryQuality?: 'high' | 'medium' | 'low';
}

export interface CognitiveDomainScores {
  attention: number;
  inhibition: number;
  processingSpeed: number;
  workingMemory: number;
  planning: number;
}

export interface CognitiveProfile {
  currentScores: CognitiveDomainScores;
  relativeLevels: CognitiveDomainScores; // Renamed from percentiles to Relative Performance Level (Göreceli Düzey)
  trends: {
    attention: 'improving' | 'stable' | 'declining';
    inhibition: 'improving' | 'stable' | 'declining';
    processingSpeed: 'improving' | 'stable' | 'declining';
    workingMemory: 'improving' | 'stable' | 'declining';
    planning: 'improving' | 'stable' | 'declining';
  };
  metaMetrics: {
    overallConsistencyScore: number;
    fatigueResistance: number;
  };
  confidenceScores: {
    attention: number;        // 0.0 to 1.0
    inhibition: number;       // 0.0 to 1.0
    processingSpeed: number;  // 0.0 to 1.0
    workingMemory: number;    // 0.0 to 1.0
    planning: number;         // 0.0 to 1.0
  };
  confidenceReasons: {
    attention: string;
    inhibition: string;
    processingSpeed: string;
    workingMemory: string;
    planning: string;
  };
  aiEligibility: {
    attention: boolean;
    inhibition: boolean;
    processingSpeed: boolean;
    workingMemory: boolean;
    planning: boolean;
  };
  evidence: {
    attention: string[];
    inhibition: string[];
    processingSpeed: string[];
    workingMemory: string[];
    planning: string[];
  };
}

export class CognitiveScoringEngine {
  // Sigmoid parameters (midpoint, steepness)
  private static readonly SIGMOID_PARAMS = {
    reactionTime: { midpoint: 550, steepness: 0.008 },      // smaller is better (ms)
    decisionTime: { midpoint: 5000, steepness: 0.0008 },    // smaller is better (ms)
    hesitation: { midpoint: 1500, steepness: 0.0025 },       // smaller is better (ms)
    missedStimuli: { midpoint: 3, steepness: 0.5 },         // smaller is better (count)
    falseAlarms: { midpoint: 4, steepness: 0.4 },           // smaller is better (count)
    impulsiveStarts: { midpoint: 2, steepness: 0.8 },       // smaller is better (count)
    memorySpan: { midpoint: 5, steepness: 1.0 },            // larger is better (count)
    deadEnds: { midpoint: 3, steepness: 0.5 },              // smaller is better (count)
    replanning: { midpoint: 2, steepness: 0.8 },            // smaller is better (count)
  };

  /**
   * Sigmoid Normalization for positive metrics (higher is better).
   */
  private static sigmoidDirect(x: number, midpoint: number, steepness: number): number {
    const score = 100 / (1 + Math.exp(-steepness * (x - midpoint)));
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Sigmoid Normalization for negative/inverse metrics (lower is better).
   */
  private static sigmoidInverse(x: number, midpoint: number, steepness: number): number {
    const score = 100 / (1 + Math.exp(steepness * (x - midpoint)));
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculates a weighted rolling average of the last 5 session-level scores.
   * Dynamically normalizes weights if fewer than 5 scores are available.
   * index 0 is oldest, last index is newest (chronological order).
   */
  private static calculateWeightedRollingAverage(scores: number[]): number {
    const N = scores.length;
    if (N === 0) return 50; // default baseline

    const baseWeights = [0.40, 0.25, 0.15, 0.10, 0.10];
    let weightedSum = 0;
    let weightSum = 0;

    for (let i = 0; i < N && i < 5; i++) {
      const score = scores[N - 1 - i]; // newest first
      const weight = baseWeights[i];
      weightedSum += score * weight;
      weightSum += weight;
    }

    return weightedSum / weightSum;
  }

  /**
   * Calculates a robust confidence score for a domain based on multi-dimensional evidence.
   */
  private static calculateDomainConfidence(
    domainSessions: GameSessionPayload[],
    targetRounds: number,
    consistencyScore: number = 1.0
  ): { confidence: number; reason: string } {
    const sessionCount = domainSessions.length;
    if (sessionCount === 0) return { confidence: 0.0, reason: 'Oturum verisi bulunmuyor.' };

    const uniqueDaysWeight = 0.4;
    const completenessWeight = 0.3;
    const sessionCountWeight = 0.2;
    const consistencyWeight = 0.1;

    // 1. Unique Days Metric
    const uniqueDaysCount = new Set(domainSessions.map(s => s.createdAt?.split('T')[0] || 'unknown')).size;
    const uniqueDaysScore = Math.min(1, uniqueDaysCount / 3); // 3 days for max unique days confidence

    // 2. Session Count Metric
    const sessionCountScore = Math.min(1, sessionCount / 5); // 5 sessions for max session confidence

    // 3. Completeness Metric (Enhanced with Telemetry Quality)
    let completenessScore = 0.8; // Default base completeness
    if (domainSessions.some(s => s.telemetryQuality)) {
      const highQ = domainSessions.filter(s => s.telemetryQuality === 'high').length;
      const medQ = domainSessions.filter(s => s.telemetryQuality === 'medium').length;
      const lowQ = domainSessions.filter(s => s.telemetryQuality === 'low').length;
      // Weighted quality score
      const qualityScore = sessionCount > 0 ? ((highQ * 1.0) + (medQ * 0.7) + (lowQ * 0.2)) / sessionCount : 0;
      completenessScore = Math.min(1, (completenessScore + qualityScore) / 2);
    }

    const confidence = (
      (uniqueDaysScore * uniqueDaysWeight) +
      (completenessScore * completenessWeight) +
      (sessionCountScore * sessionCountWeight) +
      (consistencyScore * consistencyWeight)
    );

    // Generate Evidence String for UI
    let reason = `${uniqueDaysCount} farklı günde toplam ${sessionCount} oturum oynanmıştır. `;
    if (uniqueDaysScore < 0.5) {
      reason += 'Güvenilir bir analiz için oyunun farklı günlerde düzenli oynanması önerilir. ';
    }
    if (completenessScore < 0.8) {
      reason += 'Bazı oyun içi ölçümler (telemetri) tam olarak doğrulanamadı. ';
    }
    if (consistencyScore < 0.6) {
      reason += 'Performans dalgalanması yüksek. ';
    }
    
    // Add default reason if nothing specific
    if (reason.split('.').length <= 2 && confidence > 0.7) {
      reason += 'Oyun oturumu sayısı ve veriler güvenilir seviyededir.';
    }

    return { confidence, reason: reason.trim() };
  }

  /**
   * Compiles historical game sessions into a Unified Cognitive Profile.
   */
  public static compileProfile(sessions: GameSessionPayload[], previousProfile?: CognitiveProfile): CognitiveProfile {
    // Group sessions chronologically (assumed input order is chronological)
    const attentionSessions = sessions.filter(s => s.gameId === 'attention');
    const reactionSessions = sessions.filter(s => s.gameId === 'reaction' || s.gameId === 'logic');
    const memorySessions = sessions.filter(s => s.gameId === 'pattern_memory');
    const planningSessions = sessions.filter(s => s.gameId === 'planning' || s.gameId === 'memory');

    // Calculate dynamic target rounds based on game types played (to avoid penalizing incomplete game options)
    let attentionTargetRounds = 0;
    if (attentionSessions.length > 0) attentionTargetRounds += 3 * 8;
    if (reactionSessions.length > 0) attentionTargetRounds += 3 * 24;
    if (attentionTargetRounds === 0) attentionTargetRounds = 3 * 8;

    let inhibitionTargetRounds = 0;
    if (attentionSessions.length > 0) inhibitionTargetRounds += 3 * 8;
    if (reactionSessions.length > 0) inhibitionTargetRounds += 3 * 24;
    if (planningSessions.length > 0) inhibitionTargetRounds += 3 * 8;
    if (inhibitionTargetRounds === 0) inhibitionTargetRounds = 3 * 8;

    let speedTargetRounds = 0;
    if (reactionSessions.length > 0) speedTargetRounds += 3 * 24;
    if (attentionSessions.length > 0) speedTargetRounds += 3 * 8;
    if (memorySessions.length > 0) speedTargetRounds += 3 * 24;
    if (planningSessions.length > 0) speedTargetRounds += 3 * 8;
    if (speedTargetRounds === 0) speedTargetRounds = 3 * 24;

    const memoryTargetRounds = 3 * 24;
    const planningTargetRounds = 3 * 8;

    // 1. Calculate Domain-specific Confidence Scores
    const attentionConf = this.calculateDomainConfidence([...attentionSessions, ...reactionSessions], attentionTargetRounds);
    const inhibitionConf = this.calculateDomainConfidence([...attentionSessions, ...reactionSessions, ...planningSessions], inhibitionTargetRounds);
    const speedConf = this.calculateDomainConfidence([...reactionSessions, ...attentionSessions, ...memorySessions, ...planningSessions], speedTargetRounds);
    const memoryConf = this.calculateDomainConfidence(memorySessions, memoryTargetRounds);
    const planningConf = this.calculateDomainConfidence(planningSessions, planningTargetRounds);

    const confidenceScores = {
      attention: attentionConf.confidence,
      inhibition: inhibitionConf.confidence,
      processingSpeed: speedConf.confidence,
      workingMemory: memoryConf.confidence,
      planning: planningConf.confidence,
    };

    const confidenceReasons = {
      attention: attentionConf.reason,
      inhibition: inhibitionConf.reason,
      processingSpeed: speedConf.reason,
      workingMemory: memoryConf.reason,
      planning: planningConf.reason,
    };

    // 2. Calculate Domain Scores using Rolling Averages
    const attentionScore = this.calculateAttentionScore(attentionSessions, reactionSessions);
    const inhibitionScore = this.calculateInhibitionScore(attentionSessions, reactionSessions, planningSessions);
    const speedScore = this.calculateProcessingSpeedScore(reactionSessions, attentionSessions, memorySessions, planningSessions);
    const memoryScore = this.calculateWorkingMemoryScore(memorySessions);
    const planningScore = this.calculatePlanningScore(planningSessions);

    const currentScores: CognitiveDomainScores = {
      attention: Math.round(attentionScore),
      inhibition: Math.round(inhibitionScore),
      processingSpeed: Math.round(speedScore),
      workingMemory: Math.round(memoryScore),
      planning: Math.round(planningScore),
    };

    // 3. Map to Relative Levels (Göreceli Düzey / Relative Performance Level)
    const relativeLevels: CognitiveDomainScores = {
      attention: this.mapToPercentile(currentScores.attention),
      inhibition: this.mapToPercentile(currentScores.inhibition),
      processingSpeed: this.mapToPercentile(currentScores.processingSpeed),
      workingMemory: this.mapToPercentile(currentScores.workingMemory),
      planning: this.mapToPercentile(currentScores.planning),
    };

    // 4. Evaluate Trends
    const trends = this.calculateTrends(currentScores, previousProfile);

    // 5. Meta-Metrics (Consistency & Fatigue)
    const overallConsistencyScore = this.calculateConsistencyScore(reactionSessions, memorySessions);
    const fatigueResistance = this.calculateFatigueScore(reactionSessions, memorySessions, attentionSessions);

    // 6. AI Eligibility & Evidence Generation
    const aiEligibility = {
      attention: true,
      inhibition: true,
      processingSpeed: true,
      workingMemory: true,
      planning: true,
    };

    const hasProxy = (sess: GameSessionPayload[]) => sess.some((s: GameSessionPayload) => s.metadata?.source === 'proxy' || s.telemetryVerified === false);

    if (hasProxy(attentionSessions)) {
      aiEligibility.attention = false;
      confidenceReasons.attention = 'Sentetik veya eksik veri. Analize uygun değil.';
    }
    if (hasProxy([...attentionSessions, ...reactionSessions, ...planningSessions])) {
      aiEligibility.inhibition = false;
      confidenceReasons.inhibition = 'Sentetik veya eksik veri. Analize uygun değil.';
    }
    if (hasProxy([...reactionSessions, ...attentionSessions, ...memorySessions, ...planningSessions])) {
      aiEligibility.processingSpeed = false;
      confidenceReasons.processingSpeed = 'Sentetik veya eksik veri. Analize uygun değil.';
    }
    if (hasProxy(memorySessions)) {
      aiEligibility.workingMemory = false;
      confidenceReasons.workingMemory = 'Sentetik veya eksik veri. Analize uygun değil.';
    }
    if (hasProxy(planningSessions)) {
      aiEligibility.planning = false;
      confidenceReasons.planning = 'Sentetik veya eksik veri. Analize uygun değil.';
    }

    const evidence = {
      attention: [`${attentionSessions.length} attention sessions played.`],
      inhibition: [`Based on false starts and distractor reactions.`],
      processingSpeed: [`Average reaction time and hesitation used.`],
      workingMemory: [`${memorySessions.length} sequence memory tests completed.`],
      planning: [`${planningSessions.length} real planning sessions recorded.`, `Route efficiency and replanning utilized.`],
    };

    return {
      currentScores,
      relativeLevels,
      trends,
      metaMetrics: {
        overallConsistencyScore,
        fatigueResistance,
      },
      confidenceScores,
      confidenceReasons,
      aiEligibility,
      evidence,
    };
  }

  // --- Domain Score Implementations ---

  private static calculateAttentionScore(attentionSessions: GameSessionPayload[], reactionSessions: GameSessionPayload[]): number {
    const attentionGameScores = attentionSessions.map(s => {
      const attentionScore = s.metadata?.attentionScore ?? (s.accuracy * 100);
      const recoveryRate = s.metadata?.attentionRecoveryRate ?? 100;
      return (attentionScore * (0.5 / 0.75)) + (recoveryRate * (0.25 / 0.75));
    });

    const reactionGameScores = reactionSessions.map(s => {
      const missed = s.metadata?.missedStimuli ?? 0;
      return this.sigmoidInverse(
        missed,
        this.SIGMOID_PARAMS.missedStimuli.midpoint,
        this.SIGMOID_PARAMS.missedStimuli.steepness
      );
    });

    const avgAttention = this.calculateWeightedRollingAverage(attentionGameScores);
    const avgReaction = this.calculateWeightedRollingAverage(reactionGameScores);

    let sum = 0;
    let weightSum = 0;

    if (attentionGameScores.length > 0) {
      sum += avgAttention * 0.75;
      weightSum += 0.75;
    }
    if (reactionGameScores.length > 0) {
      sum += avgReaction * 0.25;
      weightSum += 0.25;
    }

    return weightSum > 0 ? sum / weightSum : 50;
  }

  private static calculateInhibitionScore(
    attentionSessions: GameSessionPayload[],
    reactionSessions: GameSessionPayload[],
    planningSessions: GameSessionPayload[]
  ): number {
    const attentionGameScores = attentionSessions.map(s => s.metadata?.inhibitionScore ?? 100);

    const reactionGameScores = reactionSessions.map(s => {
      const falseStarts = s.metadata?.falseStarts ?? 0;
      const fsScore = this.sigmoidInverse(
        falseStarts,
        this.SIGMOID_PARAMS.falseAlarms.midpoint,
        this.SIGMOID_PARAMS.falseAlarms.steepness
      );

      const distractorTaps = s.metadata?.distractorTaps ?? 0;
      const dtScore = this.sigmoidInverse(
        distractorTaps,
        this.SIGMOID_PARAMS.falseAlarms.midpoint,
        this.SIGMOID_PARAMS.falseAlarms.steepness
      );

      return (fsScore * (0.3 / 0.45)) + (dtScore * (0.15 / 0.45));
    });

    const planningGameScores = planningSessions.map(s => {
      const impulsiveStarts = s.metadata?.impulsiveStarts ?? 0;
      return this.sigmoidInverse(
        impulsiveStarts,
        this.SIGMOID_PARAMS.impulsiveStarts.midpoint,
        this.SIGMOID_PARAMS.impulsiveStarts.steepness
      );
    });

    const avgAttention = this.calculateWeightedRollingAverage(attentionGameScores);
    const avgReaction = this.calculateWeightedRollingAverage(reactionGameScores);
    const avgPlanning = this.calculateWeightedRollingAverage(planningGameScores);

    let sum = 0;
    let weightSum = 0;

    if (attentionGameScores.length > 0) {
      sum += avgAttention * 0.4;
      weightSum += 0.4;
    }
    if (reactionGameScores.length > 0) {
      sum += avgReaction * 0.45;
      weightSum += 0.45;
    }
    if (planningGameScores.length > 0) {
      sum += avgPlanning * 0.15;
      weightSum += 0.15;
    }

    return weightSum > 0 ? sum / weightSum : 50;
  }

  private static calculateProcessingSpeedScore(
    reaction: GameSessionPayload[],
    attention: GameSessionPayload[],
    memory: GameSessionPayload[],
    planning: GameSessionPayload[]
  ): number {
    const reactionScores = reaction.map(s => {
      const rt = s.metadata?.reactionTimeMedian ?? 500;
      return this.sigmoidInverse(
        rt,
        this.SIGMOID_PARAMS.reactionTime.midpoint,
        this.SIGMOID_PARAMS.reactionTime.steepness
      );
    });

    const attentionScores = attention.map(s => {
      const rt = s.metadata?.avgReactionTime ?? 600;
      return this.sigmoidInverse(
        rt,
        this.SIGMOID_PARAMS.reactionTime.midpoint,
        this.SIGMOID_PARAMS.reactionTime.steepness
      );
    });

    const memoryScores = memory.map(s => {
      const hes = s.metadata?.avgHesitationInterval ?? 1500;
      return this.sigmoidInverse(
        hes,
        this.SIGMOID_PARAMS.hesitation.midpoint,
        this.SIGMOID_PARAMS.hesitation.steepness
      );
    });

    const planningScores = planning.map(s => {
      const dec = s.metadata?.avgDecisionTime ?? 5000;
      return this.sigmoidInverse(
        dec,
        this.SIGMOID_PARAMS.decisionTime.midpoint,
        this.SIGMOID_PARAMS.decisionTime.steepness
      );
    });

    const avgReaction = this.calculateWeightedRollingAverage(reactionScores);
    const avgAttention = this.calculateWeightedRollingAverage(attentionScores);
    const avgMemory = this.calculateWeightedRollingAverage(memoryScores);
    const avgPlanning = this.calculateWeightedRollingAverage(planningScores);

    let sum = 0;
    let weightSum = 0;

    if (reactionScores.length > 0) {
      sum += avgReaction * 0.5;
      weightSum += 0.5;
    }
    if (attentionScores.length > 0) {
      sum += avgAttention * 0.25;
      weightSum += 0.25;
    }
    if (memoryScores.length > 0) {
      sum += avgMemory * 0.15;
      weightSum += 0.15;
    }
    if (planningScores.length > 0) {
      sum += avgPlanning * 0.10;
      weightSum += 0.10;
    }

    return weightSum > 0 ? sum / weightSum : 50;
  }

  private static calculateWorkingMemoryScore(memorySessions: GameSessionPayload[]): number {
    const sessionScores = memorySessions.map(s => {
      const maxSpan = s.metadata?.maxSpanReached ?? 3;
      const accuracy = s.metadata?.retrievalAccuracy ?? s.accuracy ?? 1.0;

      const normalizedSpan = this.sigmoidDirect(
        maxSpan,
        this.SIGMOID_PARAMS.memorySpan.midpoint,
        this.SIGMOID_PARAMS.memorySpan.steepness
      );

      return (normalizedSpan * 0.6) + (accuracy * 100 * 0.4);
    });

    return this.calculateWeightedRollingAverage(sessionScores);
  }

  private static calculatePlanningScore(planningSessions: GameSessionPayload[]): number {
    const sessionScores = planningSessions.map(s => {
      if (s.metadata?.source === 'proxy' || !s.metadata?.planning || s.telemetryVerified === false) {
        return s.metadata?.planningScore ?? (s.accuracy * 100);
      }

      const telemetry: PlanningTelemetry = s.metadata.planning;

      const normRouteEfficiency = Math.max(0, Math.min(100, (telemetry.routeEfficiency ?? 0) * 100));
      const normOptimalPathRatio = Math.max(0, Math.min(100, (telemetry.optimalPathRatio ?? 0) * 100));
      const normReplanningQuality = Math.max(0, Math.min(100, (telemetry.replanningQuality ?? 0) * 100));

      const hintsPenalty = (telemetry.hints ?? 0) * 5; // 5 points per hint
      const normDeadEnds = Math.max(0, 100 - ((telemetry.deadEnds ?? 0) * 10)); // 10 points per dead-end
      const normPlanningTime = this.sigmoidInverse(telemetry.planningTimeMs ?? 5000, 8000, 0.001);

      const score = (normRouteEfficiency * PLANNING_WEIGHTS.routeEfficiency) +
        (normOptimalPathRatio * PLANNING_WEIGHTS.optimalPathRatio) +
        (normReplanningQuality * PLANNING_WEIGHTS.replanningQuality) +
        (normDeadEnds * PLANNING_WEIGHTS.deadEnds) +
        (normPlanningTime * PLANNING_WEIGHTS.planningTime) - hintsPenalty;

      return Math.max(0, Math.min(100, score));
    });

    return this.calculateWeightedRollingAverage(sessionScores);
  }

  // --- Meta-Metrics ---

  private static calculateConsistencyScore(
    reaction: GameSessionPayload[],
    memory: GameSessionPayload[]
  ): number {
    let sum = 0;
    let weightSum = 0;

    if (reaction.length > 0) {
      const last = reaction[reaction.length - 1];
      if (last.metadata?.consistencyScore !== undefined) {
        sum += last.metadata.consistencyScore * 0.5;
        weightSum += 0.5;
      }
    }

    if (memory.length > 0) {
      const last = memory[memory.length - 1];
      if (last.metadata?.consistencyScore !== undefined) {
        sum += last.metadata.consistencyScore * 0.5;
        weightSum += 0.5;
      }
    }

    return weightSum > 0 ? Math.round(sum / weightSum) : 75; // baseline consistency
  }

  private static calculateFatigueScore(
    reaction: GameSessionPayload[],
    memory: GameSessionPayload[],
    attention: GameSessionPayload[]
  ): number {
    const input: FatigueMetricsInput = {};

    if (reaction.length > 0) {
      input.reactionTimeFatigueSlope = reaction[reaction.length - 1].metadata?.fatigueSlope;
    }
    if (memory.length > 0) {
      input.hesitationVariance = memory[memory.length - 1].metadata?.hesitationVariance;
    }
    if (attention.length > 0) {
      input.attentionRecoveryRate = attention[attention.length - 1].metadata?.attentionRecoveryRate;
    }

    return FatigueEngine.calculateFatigueResistance(input);
  }

  private static calculateTrends(
    current: CognitiveDomainScores,
    prev?: CognitiveProfile
  ): CognitiveProfile['trends'] {
    const defaultTrends: CognitiveProfile['trends'] = {
      attention: 'stable',
      inhibition: 'stable',
      processingSpeed: 'stable',
      workingMemory: 'stable',
      planning: 'stable',
    };

    if (!prev) return defaultTrends;

    const domains: (keyof CognitiveDomainScores)[] = [
      'attention',
      'inhibition',
      'processingSpeed',
      'workingMemory',
      'planning',
    ];

    domains.forEach(domain => {
      const diff = current[domain] - prev.currentScores[domain];
      if (diff >= 5) {
        defaultTrends[domain] = 'improving';
      } else if (diff <= -5) {
        defaultTrends[domain] = 'declining';
      } else {
        defaultTrends[domain] = 'stable';
      }
    });

    return defaultTrends;
  }

  private static mapToPercentile(score: number): number {
    if (score >= 90) return Math.round(95 + (score - 90) * 0.4); // 95 - 99
    if (score >= 75) return Math.round(85 + (score - 75) * 0.67); // 85 - 95
    if (score >= 50) return Math.round(50 + (score - 50) * 1.4);  // 50 - 85
    if (score >= 30) return Math.round(15 + (score - 30) * 1.75); // 15 - 50
    return Math.round(Math.max(1, score * 0.5));                  // 1 - 15
  }
}
