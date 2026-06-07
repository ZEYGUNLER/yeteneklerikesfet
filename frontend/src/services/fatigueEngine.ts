/**
 * Fatigue Resistance Engine
 * Isolates calculations determining how well a child maintains performance
 * over sustained periods, resisting performance decay (fatigue).
 */

export interface FatigueMetricsInput {
  reactionTimeFatigueSlope?: number;      // from Yıldırım Kulesi (reaction RT slope)
  hesitationVariance?: number;            // from Kristal Tapınak (hesitation stability)
  attentionRecoveryRate?: number;         // from Dikkat Ormanı (recovery capacity)
  totalDuration?: number;                 // total gameplay duration in seconds
}

export class FatigueEngine {
  /**
   * Calculates a normalized Fatigue Resistance Score (0 - 100).
   * Higher scores represent high resistance to fatigue (minimal performance decay).
   * Uses a confidence-adjusted neutral fallback instead of defaulting to 100.
   */
  public static calculateFatigueResistance(input: FatigueMetricsInput): number {
    const weights = {
      slope: 0.4,
      variance: 0.3,
      recovery: 0.3,
    };

    let totalWeightUsed = 0;
    let weightedScoreSum = 0;
    let fieldsCount = 0;

    // 1. Evaluate Fatigue Slope (Reaction time deterioration)
    // A slope of 0 or less is ideal (100). A slope of 50ms/trial or more shows high fatigue (0).
    if (input.reactionTimeFatigueSlope !== undefined) {
      const slope = input.reactionTimeFatigueSlope;
      let slopeScore = 100;
      if (slope > 0) {
        slopeScore = Math.max(0, 100 - (slope * 2)); // 50ms slope maps to 0
      }
      weightedScoreSum += slopeScore * weights.slope;
      totalWeightUsed += weights.slope;
      fieldsCount++;
    }

    // 2. Evaluate Hesitation Variance (Stability of pacing)
    // High variance in hesitation indicates fatigue.
    // Variance under 5000 is excellent (100). Variance above 50000 indicates severe instability (0).
    if (input.hesitationVariance !== undefined) {
      const variance = input.hesitationVariance;
      const minVar = 5000;
      const maxVar = 50000;
      let varianceScore = 100;
      if (variance > minVar) {
        varianceScore = Math.max(0, 100 - ((variance - minVar) / (maxVar - minVar)) * 100);
      }
      weightedScoreSum += varianceScore * weights.variance;
      totalWeightUsed += weights.variance;
      fieldsCount++;
    }

    // 3. Evaluate Attention Recovery Rate (Resilience after errors)
    // Already normalized (0-100), direct map.
    if (input.attentionRecoveryRate !== undefined) {
      const recoveryScore = Math.max(0, Math.min(100, input.attentionRecoveryRate));
      weightedScoreSum += recoveryScore * weights.recovery;
      totalWeightUsed += weights.recovery;
      fieldsCount++;
    }

    // Determine data confidence (0.0 to 1.0)
    const confidence = fieldsCount / 3;

    if (confidence === 0) {
      return 50; // Perfect neutral fallback when there is absolutely no data
    }

    const calculatedScore = weightedScoreSum / totalWeightUsed;

    // Option B: Confidence-adjusted neutral estimate
    const finalScore = (calculatedScore * confidence) + (50 * (1 - confidence));

    return Math.round(finalScore);
  }
}
