/**
 * ADAPTIVE ENGINE — Phase G7
 *
 * The intelligence brain of the Yeteneklerini Keşfet platform.
 * Monitors real-time behavioral signals and computes adaptive game parameters
 * that make every session feel personally tuned for the child.
 *
 * ARCHITECTURE:
 *   - Singleton service (one instance per app lifetime)
 *   - Session-scoped state (reset between games via reset())
 *   - Pure heuristics — no ML, no network, no heavy computation
 *   - All parameters pass through adaptiveSafetyRules before being exposed
 *
 * ETHICS:
 *   - Supports learning, confidence, and engagement — never manipulation
 *   - Cognitive metrics (in useGameMetrics) remain completely untouched
 *   - Adaptive params only affect presentation (timing, phrasing, complexity hints)
 *   - Full rollback: removing useAdaptiveEngine restores exact previous behavior
 *
 * PERFORMANCE:
 *   - O(1) param computation after O(N) window scan (N ≤ 20)
 *   - No React state — engine is a plain object, not a hook
 *   - Zero re-renders triggered from within this file
 */

import { analyzeFrustration, type InteractionEvent } from './frustrationMonitor';
import { validateAdaptiveParams, type SafeAdaptiveParams } from './adaptiveSafetyRules';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type SessionMood =
  | 'focused'
  | 'excited'
  | 'tired'
  | 'frustrated'
  | 'overwhelmed'
  | 'neutral';

export interface AdaptiveState {
  /** Rolling window of last N interactions */
  eventWindow: InteractionEvent[];
  /** Number of rounds played so far this session */
  roundCount: number;
  /** Session start timestamp */
  sessionStartMs: number;
  /** Last event timestamp */
  lastEventMs: number;
  /** Computed in last update cycle */
  confidenceScore: number;   // 0–1
  fatigueIndex: number;      // 0–1 (1 = very fatigued)
  frustrationLevel: number;  // 0–1
  sessionMood: SessionMood;
  /** The current safe adaptive params */
  params: SafeAdaptiveParams;
  /** Running delta (persisted across rounds for smooth transitions) */
  currentComplexityDelta: number;
}

export interface AdaptiveEngineInsights {
  confidenceScore: number;
  fatigueIndex: number;
  frustrationLevel: number;
  sessionMood: SessionMood;
  totalRounds: number;
  /** Ratio of rounds where easing was active — lower is better */
  easingRatio: number;
  /** Ratio of rounds where escalation was active */
  escalationRatio: number;
  /** Dominant encouragement mode used this session */
  dominantEncouragement: 'support' | 'neutral' | 'celebrate';
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const WINDOW_SIZE = 20;

const DEFAULT_PARAMS: SafeAdaptiveParams = {
  speedMultiplier: 1.0,
  complexityDelta: 0,
  rewardFrequency: 'normal',
  encouragementMode: 'neutral',
  isSafetyValidated: true,
};

const DEFAULT_STATE: Omit<AdaptiveState, 'sessionStartMs'> = {
  eventWindow: [],
  roundCount: 0,
  lastEventMs: 0,
  confidenceScore: 0.5,
  fatigueIndex: 0.0,
  frustrationLevel: 0.0,
  sessionMood: 'neutral',
  params: DEFAULT_PARAMS,
  currentComplexityDelta: 0,
};

// ─── Scoring Helpers ─────────────────────────────────────────────────────────────

/**
 * Confidence: how comfortable and capable the child feels right now.
 * Inputs: streak stability, recovery speed, hesitation ratio.
 * Output: 0–1 (1 = very confident)
 */
function computeConfidenceScore(events: InteractionEvent[]): number {
  if (events.length === 0) return 0.5;

  const recent = events.slice(-10);
  const correctCount = recent.filter((e) => e.isCorrect).length;
  const accuracy = correctCount / recent.length;

  // Streak at the tail
  let streakLen = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].isCorrect) streakLen++;
    else break;
  }
  const streakBonus = Math.min(streakLen / 5, 0.3); // max +0.3

  // Hesitation penalty
  const avgReaction =
    recent.reduce((s, e) => s + e.reactionTimeMs, 0) / recent.length;
  const hesitationPenalty = avgReaction > 3000 ? 0.2 : avgReaction > 2000 ? 0.1 : 0;

  const score = Math.max(0, Math.min(1, accuracy * 0.7 + streakBonus - hesitationPenalty));
  return parseFloat(score.toFixed(2));
}

/**
 * Fatigue: how cognitively depleted the child is becoming.
 * Inputs: reaction trend (are they slowing down?), rhythm variance, session time.
 * Output: 0–1 (1 = very fatigued)
 */
function computeFatigueIndex(events: InteractionEvent[], sessionDurationMs: number): number {
  if (events.length < 6) return 0;

  // Compare early vs late reaction times
  const firstHalf = events.slice(0, Math.floor(events.length / 2));
  const secondHalf = events.slice(Math.floor(events.length / 2));

  const avgFirst =
    firstHalf.reduce((s, e) => s + e.reactionTimeMs, 0) / firstHalf.length;
  const avgSecond =
    secondHalf.reduce((s, e) => s + e.reactionTimeMs, 0) / secondHalf.length;

  // Reaction time increase ratio (1.0 = same, >1.0 = getting slower)
  const slowdownRatio = avgFirst > 0 ? avgSecond / avgFirst : 1.0;
  const slowdownFatigue = Math.max(0, Math.min(0.6, (slowdownRatio - 1.0) * 1.5));

  // Session duration factor (gradual rise after 10 minutes)
  const minutes = sessionDurationMs / 60_000;
  const durationFatigue = Math.max(0, Math.min(0.4, (minutes - 10) / 15));

  const index = parseFloat((slowdownFatigue + durationFatigue).toFixed(2));
  return Math.min(1, index);
}

/**
 * Determine session mood from the three composite scores.
 */
function computeSessionMood(
  confidence: number,
  fatigue: number,
  frustration: number
): SessionMood {
  if (frustration >= 0.75) return 'overwhelmed';
  if (frustration >= 0.50) return 'frustrated';
  if (fatigue >= 0.65) return 'tired';
  if (confidence >= 0.80 && fatigue < 0.30) return 'excited';
  if (confidence >= 0.60 && fatigue < 0.50) return 'focused';
  return 'neutral';
}

/**
 * Translate all computed scores into raw adaptive parameters.
 * These are then validated by adaptiveSafetyRules before exposure.
 */
function computeRawParams(
  confidence: number,
  fatigue: number,
  frustration: number,
  mood: SessionMood,
  frustrationRecommendation: 'none' | 'encourage' | 'ease' | 'pause'
) {
  let speedMultiplier = 1.0;
  let complexityDelta = 0;
  let rewardFrequency: SafeAdaptiveParams['rewardFrequency'] = 'normal';
  let encouragementMode: SafeAdaptiveParams['encouragementMode'] = 'neutral';

  // ── Speed scaling ──────────────────────────────────────────────
  if (mood === 'excited') speedMultiplier = 1.15;
  else if (mood === 'focused') speedMultiplier = 1.05;
  else if (mood === 'tired') speedMultiplier = 0.85;
  else if (mood === 'frustrated') speedMultiplier = 0.80;
  else if (mood === 'overwhelmed') speedMultiplier = 0.75;

  // ── Complexity delta ───────────────────────────────────────────
  if (confidence >= 0.85 && fatigue < 0.35 && frustration < 0.25) {
    complexityDelta = 2;   // mastery signal — push harder
  } else if (confidence >= 0.70 && fatigue < 0.50) {
    complexityDelta = 1;   // doing well
  } else if (confidence < 0.40 || frustrationRecommendation === 'ease') {
    complexityDelta = -2;  // struggling — fast mercy
  } else if (confidence < 0.55) {
    complexityDelta = -1;  // slightly below average
  }
  // else 0 = stay at current difficulty (neutral / default)

  // ── Reward frequency ───────────────────────────────────────────
  if (mood === 'frustrated' || mood === 'overwhelmed') rewardFrequency = 'high';
  else if (mood === 'excited') rewardFrequency = 'low'; // don't interrupt flow
  else rewardFrequency = 'normal';

  // ── Encouragement mode ─────────────────────────────────────────
  if (frustrationRecommendation === 'ease' || frustrationRecommendation === 'pause') {
    encouragementMode = 'support';
  } else if (confidence >= 0.75 && mood !== 'tired') {
    encouragementMode = 'celebrate';
  } else {
    encouragementMode = 'neutral';
  }

  return { speedMultiplier, complexityDelta, rewardFrequency, encouragementMode };
}

// ─── Session Tracking for Insights ──────────────────────────────────────────────

interface SessionTracker {
  easingRounds: number;
  escalationRounds: number;
  encouragementModes: SafeAdaptiveParams['encouragementMode'][];
}

// ─── Engine Singleton ────────────────────────────────────────────────────────────

function createAdaptiveEngine() {
  let state: AdaptiveState = {
    ...DEFAULT_STATE,
    sessionStartMs: Date.now(),
  };

  let tracker: SessionTracker = {
    easingRounds: 0,
    escalationRounds: 0,
    encouragementModes: [],
  };

  // ── Internal Update ──────────────────────────────────────────────────────────

  function _update(nowMs: number): void {
    const sessionDurationMs = nowMs - state.sessionStartMs;
    const events = state.eventWindow;

    // 1. Compute scores
    const confidence = computeConfidenceScore(events);
    const fatigue = computeFatigueIndex(events, sessionDurationMs);

    // 2. Frustration analysis
    const frustrationReport = analyzeFrustration(events, state.lastEventMs, nowMs);
    const frustration = frustrationReport.level;

    // 3. Session mood
    const mood = computeSessionMood(confidence, fatigue, frustration);

    // 4. Raw params
    const rawParams = computeRawParams(
      confidence,
      fatigue,
      frustration,
      mood,
      frustrationReport.recommendation
    );

    // 5. Safety validation
    const safeParams = validateAdaptiveParams(
      rawParams,
      state.currentComplexityDelta,
      fatigue,
      sessionDurationMs
    );

    // 6. Track session insights
    if (safeParams.complexityDelta < 0) tracker.easingRounds++;
    if (safeParams.complexityDelta > 0) tracker.escalationRounds++;
    tracker.encouragementModes.push(safeParams.encouragementMode);

    // 7. Persist
    state = {
      ...state,
      confidenceScore: confidence,
      fatigueIndex: fatigue,
      frustrationLevel: frustration,
      sessionMood: mood,
      params: safeParams,
      currentComplexityDelta: safeParams.complexityDelta,
    };
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  return {
    /**
     * Record a child interaction event. Call this alongside useGameMetrics.recordInteraction().
     * This does NOT replace metrics — it runs in parallel.
     */
    recordEvent(event: Omit<InteractionEvent, 'timestamp'>): void {
      const now = Date.now();
      const fullEvent: InteractionEvent = { ...event, timestamp: now };

      // Maintain bounded sliding window
      const window = [...state.eventWindow, fullEvent];
      if (window.length > WINDOW_SIZE) window.shift();

      state = {
        ...state,
        eventWindow: window,
        lastEventMs: now,
        roundCount: state.roundCount + 1,
      };

      // Recompute adaptive params after new event
      _update(now);
    },

    /**
     * Get the current validated adaptive parameters.
     * Safe to call every render — values are already validated.
     */
    getAdaptiveParams(): SafeAdaptiveParams {
      return state.params;
    },

    /**
     * Get current internal scores (for analytics export in metadata).
     * These are NEVER shown to children.
     */
    getScores(): Pick<AdaptiveState, 'confidenceScore' | 'fatigueIndex' | 'frustrationLevel' | 'sessionMood'> {
      return {
        confidenceScore: state.confidenceScore,
        fatigueIndex: state.fatigueIndex,
        frustrationLevel: state.frustrationLevel,
        sessionMood: state.sessionMood,
      };
    },

    /**
     * Get end-of-session insights for parent analytics.
     * Call this in finishGame() and include in metadata.
     */
    getSessionInsights(): AdaptiveEngineInsights {
      const total = state.roundCount || 1;
      const modes = tracker.encouragementModes;
      const supportCount = modes.filter((m) => m === 'support').length;
      const celebrateCount = modes.filter((m) => m === 'celebrate').length;

      let dominant: AdaptiveEngineInsights['dominantEncouragement'] = 'neutral';
      if (supportCount > celebrateCount && supportCount > modes.length / 3) dominant = 'support';
      else if (celebrateCount > supportCount && celebrateCount > modes.length / 3) dominant = 'celebrate';

      return {
        confidenceScore: state.confidenceScore,
        fatigueIndex: state.fatigueIndex,
        frustrationLevel: state.frustrationLevel,
        sessionMood: state.sessionMood,
        totalRounds: state.roundCount,
        easingRatio: parseFloat((tracker.easingRounds / total).toFixed(2)),
        escalationRatio: parseFloat((tracker.escalationRounds / total).toFixed(2)),
        dominantEncouragement: dominant,
      };
    },

    /**
     * Reset all session state. Call at the start of each game session.
     * This ensures each game gets a clean slate.
     */
    reset(): void {
      state = {
        ...DEFAULT_STATE,
        sessionStartMs: Date.now(),
        lastEventMs: Date.now(),
      };
      tracker = {
        easingRounds: 0,
        escalationRounds: 0,
        encouragementModes: [],
      };
    },
  };
}

// Export as a singleton — one engine per app instance.
export const adaptiveEngine = createAdaptiveEngine();
export type AdaptiveEngine = ReturnType<typeof createAdaptiveEngine>;
