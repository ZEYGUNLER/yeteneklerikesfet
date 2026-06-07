/**
 * ADAPTIVE SAFETY RULES — Phase G7
 * 
 * A pure-function ethics guard for the Adaptive Intelligence System.
 * Every parameter the engine wants to apply is validated here first.
 * 
 * PHILOSOPHY:
 *   - Never manipulate. Never punish. Never overstimulate.
 *   - Difficulty must feel natural, not engineered.
 *   - Children's wellbeing is the only optimization target.
 *
 * All functions are pure (no side effects) and O(1) — safe on low-end devices.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RawAdaptiveParams {
  /** Speed multiplier: 1.0 = normal, <1 = slower, >1 = faster */
  speedMultiplier: number;
  /** Integer delta applied on top of the game's native difficulty level */
  complexityDelta: number;
  /** How often rewards/encouragement should fire */
  rewardFrequency: 'high' | 'normal' | 'low';
  /** The tone of feedback messaging */
  encouragementMode: 'celebrate' | 'neutral' | 'support';
}

export interface SafeAdaptiveParams extends RawAdaptiveParams {
  /** Always true after passing through safety rules */
  isSafetyValidated: true;
}

// ─── Limits ────────────────────────────────────────────────────────────────────

const LIMITS = {
  speed: { min: 0.70, max: 1.30 },
  complexity: { minDelta: -3, maxDelta: 2, maxIncrease: 1, maxDecrease: 2 },
  session: { fatigueGuardMinutes: 20 },
} as const;

// ─── Core Safety Functions ──────────────────────────────────────────────────────

/**
 * Clamp speed multiplier within safe sensory bounds.
 * Too fast → overstimulation. Too slow → boredom.
 */
export function clampSpeedMultiplier(value: number): number {
  return Math.max(LIMITS.speed.min, Math.min(LIMITS.speed.max, value));
}

/**
 * Clamp complexity delta. Also enforces smooth transitions:
 * - Can only increase by 1 per call (no sudden spikes)
 * - Can decrease by up to 2 per call (mercy is fast, challenge is slow)
 */
export function clampComplexityDelta(
  proposed: number,
  current: number
): number {
  const delta = proposed - current;
  let safe = current;

  if (delta > 0) {
    safe = current + Math.min(delta, LIMITS.complexity.maxIncrease);
  } else if (delta < 0) {
    safe = current + Math.max(delta, -LIMITS.complexity.maxDecrease);
  }

  return Math.max(
    LIMITS.complexity.minDelta,
    Math.min(LIMITS.complexity.maxDelta, safe)
  );
}

/**
 * Fatigue session guard: After a set session duration, difficulty
 * is automatically dampened regardless of how well the child is performing.
 * Protects cognitive clarity and prevents unhealthy over-engagement.
 */
export function applyFatigueSessionGuard(
  params: RawAdaptiveParams,
  sessionDurationMs: number
): RawAdaptiveParams {
  const minutes = sessionDurationMs / 60_000;

  if (minutes >= LIMITS.session.fatigueGuardMinutes) {
    return {
      ...params,
      speedMultiplier: Math.min(params.speedMultiplier, 0.90),
      complexityDelta: Math.min(params.complexityDelta, 0),
      rewardFrequency: 'high',
      encouragementMode: 'support',
    };
  }

  return params;
}

/**
 * During high fatigue, block complexity increases entirely.
 * The child needs relief, not challenge escalation.
 */
export function blockComplexityIfFatigued(
  params: RawAdaptiveParams,
  fatigueIndex: number
): RawAdaptiveParams {
  const FATIGUE_BLOCK_THRESHOLD = 0.70;

  if (fatigueIndex >= FATIGUE_BLOCK_THRESHOLD && params.complexityDelta > 0) {
    return { ...params, complexityDelta: 0 };
  }

  return params;
}

/**
 * Master validation pass. Apply all safety rules in sequence.
 * Returns a validated SafeAdaptiveParams object.
 */
export function validateAdaptiveParams(
  raw: RawAdaptiveParams,
  currentComplexityDelta: number,
  fatigueIndex: number,
  sessionDurationMs: number
): SafeAdaptiveParams {
  let safe: RawAdaptiveParams = {
    ...raw,
    speedMultiplier: clampSpeedMultiplier(raw.speedMultiplier),
    complexityDelta: clampComplexityDelta(raw.complexityDelta, currentComplexityDelta),
  };

  safe = blockComplexityIfFatigued(safe, fatigueIndex);
  safe = applyFatigueSessionGuard(safe, sessionDurationMs);

  return { ...safe, isSafetyValidated: true };
}

// ─── Sensory Safety Helpers ─────────────────────────────────────────────────────

/**
 * Maximum particle count allowed. Adaptive system must never request more.
 * Sensory safety is non-negotiable.
 */
export const MAX_SAFE_PARTICLES = 30;

/**
 * Minimum interval between praise/encouragement messages (ms).
 * Prevents praise spam and preserves message value.
 */
export const MIN_PRAISE_INTERVAL_MS = 2000;
