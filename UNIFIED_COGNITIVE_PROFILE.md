# Unified Cognitive Profile Architecture

## Objective
To decouple game-specific raw data payloads from the centralized analytical dashboard, a unified `CognitiveProfile` model must be established. All game session completions will pipe their raw metadata through a normalizer mapping into these standard domains.

## Standardized Domain Structure

```typescript
export interface CognitiveDomainScores {
  attention: number;        // Focus, sustained attention, omission error resilience
  inhibition: number;       // Impulse control, response suppression, patience
  processingSpeed: number;  // Visual scanning speed, reaction times, cognitive throughput
  workingMemory: number;    // Spatial span, pattern retention, retrieval accuracy
  planning: number;         // Executive function, foresight, efficiency, strategic execution
}

export interface CognitiveProfile {
  // Current absolute scores (Normalized 0-100 scale)
  currentScores: CognitiveDomainScores;
  
  // Percentile rankings based on age-matched normative data
  percentiles: CognitiveDomainScores;
  
  // Trend indicator (+ or - compared to previous sessions)
  trends: {
    attention: 'improving' | 'stable' | 'declining';
    inhibition: 'improving' | 'stable' | 'declining';
    processingSpeed: 'improving' | 'stable' | 'declining';
    workingMemory: 'improving' | 'stable' | 'declining';
    planning: 'improving' | 'stable' | 'declining';
  };

  // Generalized consistency and fatigue metrics decoupled from specific tasks
  metaMetrics: {
    overallConsistencyScore: number;  // 0-100
    fatigueResistance: number;        // 0-100 (inversely proportional to fatigueSlope)
  };
}
```

## Analytics Standards

### 1. Score Ranges
- All domains in `currentScores` MUST strictly adhere to a **0 to 100 integer range**.
- Raw metrics (e.g., `reactionTimeMedian = 350ms`) must be converted via a sigmoid or clamped linear normalization formula specific to the metric, mapped to the 0-100 range.

### 2. Normalization Formulas (Examples)
- **Inverse Metrics (e.g., Reaction Time):** 
  `normalizedScore = Math.max(0, Math.min(100, (MaxThreshold - rawRT) / (MaxThreshold - MinThreshold) * 100))`
- **Penalty Metrics (e.g., False Alarms):**
  `normalizedScore = Math.max(0, 100 - (rawPenalties * penaltyWeight))`

### 3. Trend Tracking Structure
Trends are calculated by storing a rolling average of the last 3 sessions for a specific domain. If `currentScore - rollingAverage >= 5`, trend is `improving`. If `<= -5`, trend is `declining`. Otherwise, `stable`.

### 4. Percentile Preparation
The profile separates absolute scores from relative percentiles. 
- `currentScores` reflects absolute performance for personal progress tracking.
- `percentiles` cross-references `currentScores` against the `adaptiveSafetyRules` and `WORLD_CONFIGS` age benchmarks to provide a comparative assessment (e.g., 85th percentile for 7-year-olds).
