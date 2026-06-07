/**
 * FRUSTRATION MONITOR — Phase G7
 *
 * Detects and classifies frustration signals from raw interaction events.
 * Works as a pure stateless utility consumed by adaptiveEngine.ts.
 *
 * ETHICS:
 *   - Children should NEVER feel the system working against them.
 *   - Detection is used ONLY to trigger relief, encouragement, and mercy.
 *   - No data is sent anywhere. All processing is local and ephemeral.
 *
 * All functions are O(1) or O(N) with small N (sliding window max 20).
 */

// ─── Interaction Event ──────────────────────────────────────────────────────────

export interface InteractionEvent {
  /** Unix timestamp (ms) */
  timestamp: number;
  /** Whether the child responded correctly */
  isCorrect: boolean;
  /** Time from stimulus to response (ms) */
  reactionTimeMs: number;
  /** Number of taps within this single stimulus window (rage-tap indicator) */
  tapCount: number;
}

// ─── Frustration Report ─────────────────────────────────────────────────────────

export interface FrustrationReport {
  /** 0 = no frustration, 1 = maximum frustration */
  level: number;

  /** How many consecutive failures in the current streak */
  consecutiveFails: number;

  /** Whether rapid/frantic tapping was detected */
  rageTapDetected: boolean;

  /** Whether the child appears to have gone inactive/abandoned */
  abandonSignalDetected: boolean;

  /** Recommended system response */
  recommendation: 'none' | 'encourage' | 'ease' | 'pause';
}

// ─── Thresholds ─────────────────────────────────────────────────────────────────

const THRESHOLDS = {
  failStreak: {
    warning: 3,    // gentle easing starts
    critical: 5,   // strong encouragement + mercy round
  },
  rageTap: {
    countInWindow: 4,
    windowMs: 1200,
  },
  abandon: {
    inactivityMs: 6000,   // 6 seconds of no response = likely disengaged
    hesitationAfterFail: 4000, // Long pause after failures = giving up signal
  },
} as const;

// ─── Analysis Functions ─────────────────────────────────────────────────────────

/**
 * Count the current consecutive fail streak from the tail of the event list.
 */
export function countConsecutiveFails(events: InteractionEvent[]): number {
  let count = 0;
  for (let i = events.length - 1; i >= 0; i--) {
    if (!events[i].isCorrect) count++;
    else break;
  }
  return count;
}

/**
 * Detect rage-tap: ≥N taps within a short time window.
 * Indicates the child is hitting frantically, likely frustrated.
 */
export function detectRageTap(events: InteractionEvent[]): boolean {
  if (events.length < THRESHOLDS.rageTap.countInWindow) return false;

  const recent = events.slice(-THRESHOLDS.rageTap.countInWindow);
  const timespan = recent[recent.length - 1].timestamp - recent[0].timestamp;
  const allIncorrect = recent.every((e) => !e.isCorrect);

  // High tap count in short window, all incorrect = rage-tap pattern
  const totalTaps = recent.reduce((sum, e) => sum + e.tapCount, 0);

  return (
    timespan <= THRESHOLDS.rageTap.windowMs &&
    (totalTaps >= THRESHOLDS.rageTap.countInWindow || allIncorrect)
  );
}

/**
 * Detect abandon/disengagement signal.
 * Long inactivity OR hesitation spike after previous failures.
 */
export function detectAbandonSignal(
  events: InteractionEvent[],
  lastEventTimestamp: number,
  nowMs: number
): boolean {
  const timeSinceLast = nowMs - lastEventTimestamp;

  if (timeSinceLast >= THRESHOLDS.abandon.inactivityMs) return true;

  // Hesitation spike after failures
  if (events.length >= 2) {
    const recentFails = events.slice(-3).filter((e) => !e.isCorrect).length;
    const lastReaction = events[events.length - 1]?.reactionTimeMs ?? 0;

    if (recentFails >= 2 && lastReaction > THRESHOLDS.abandon.hesitationAfterFail) {
      return true;
    }
  }

  return false;
}

/**
 * Run a full frustration analysis on the current event window.
 * Returns a structured FrustrationReport with level and recommendation.
 */
export function analyzeFrustration(
  events: InteractionEvent[],
  lastEventTimestamp: number,
  nowMs: number
): FrustrationReport {
  const consecutiveFails = countConsecutiveFails(events);
  const rageTapDetected = detectRageTap(events);
  const abandonSignalDetected = detectAbandonSignal(events, lastEventTimestamp, nowMs);

  // Compute composite frustration level (0–1)
  let level = 0;

  if (consecutiveFails >= THRESHOLDS.failStreak.critical) {
    level = Math.max(level, 0.85);
  } else if (consecutiveFails >= THRESHOLDS.failStreak.warning) {
    level = Math.max(level, 0.55);
  }

  if (rageTapDetected) level = Math.max(level, 0.75);
  if (abandonSignalDetected) level = Math.max(level, 0.65);

  // Determine recommendation
  let recommendation: FrustrationReport['recommendation'] = 'none';

  if (level >= 0.80) {
    recommendation = 'pause'; // strongest signal — offer calm
  } else if (level >= 0.60) {
    recommendation = 'ease'; // reduce difficulty + encourage
  } else if (level >= 0.40) {
    recommendation = 'encourage'; // motivational boost only
  }

  return {
    level,
    consecutiveFails,
    rageTapDetected,
    abandonSignalDetected,
    recommendation,
  };
}
