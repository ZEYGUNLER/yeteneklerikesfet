/**
 * useAdaptiveEngine — Phase G7
 *
 * React hook that bridges the adaptiveEngine singleton into game screens.
 *
 * USAGE:
 *   const { adaptiveParams, recordAdaptiveEvent, sessionMood, getAdaptiveInsights } = useAdaptiveEngine();
 *
 * IMPORTANT:
 *   - Always call recordAdaptiveEvent() alongside recordInteraction() from useGameMetrics.
 *   - The two systems are parallel and independent — neither modifies the other.
 *   - adaptiveParams are safe-validated before reaching this hook.
 *   - This hook does NOT cause re-renders on every event — params update is batched via state.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { adaptiveEngine } from '@/services/adaptiveEngine';
import type { SafeAdaptiveParams } from '@/services/adaptiveSafetyRules';
import type { SessionMood, AdaptiveEngineInsights } from '@/services/adaptiveEngine';

// ─── Hook Return Type ───────────────────────────────────────────────────────────

export interface UseAdaptiveEngineReturn {
  /** Current validated adaptive parameters — apply to game mechanics */
  adaptiveParams: SafeAdaptiveParams;

  /** Current session emotional state — use for feedback tone selection */
  sessionMood: SessionMood;

  /** Current internal scores — include in game metadata for parent analytics */
  confidenceScore: number;
  fatigueIndex: number;
  frustrationLevel: number;

  /**
   * Record an adaptive interaction event.
   * Call this alongside useGameMetrics.recordInteraction().
   *
   * @param isCorrect - Was the response correct?
   * @param reactionTimeMs - Time from stimulus to response
   * @param tapCount - Number of taps in this stimulus window (default: 1)
   */
  recordAdaptiveEvent: (
    isCorrect: boolean,
    reactionTimeMs: number,
    tapCount?: number
  ) => void;

  /**
   * Get end-of-session insights for parent analytics.
   * Call inside finishGame() and merge into metadata.
   */
  getAdaptiveInsights: () => AdaptiveEngineInsights;
}

// ─── Update Batching ────────────────────────────────────────────────────────────

// To avoid a re-render on every tap, we update React state at most every N ms.
const SYNC_INTERVAL_MS = 500;

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useAdaptiveEngine(): UseAdaptiveEngineReturn {
  // Initialize with engine defaults
  const [adaptiveParams, setAdaptiveParams] = useState<SafeAdaptiveParams>(
    () => adaptiveEngine.getAdaptiveParams()
  );

  const scores = adaptiveEngine.getScores();
  const [confidenceScore, setConfidenceScore] = useState(scores.confidenceScore);
  const [fatigueIndex, setFatigueIndex] = useState(scores.fatigueIndex);
  const [frustrationLevel, setFrustrationLevel] = useState(scores.frustrationLevel);
  const [sessionMood, setSessionMood] = useState<SessionMood>(scores.sessionMood);

  const lastSyncRef = useRef<number>(0);

  // Reset engine at mount (new game session)
  useEffect(() => {
    adaptiveEngine.reset();
    return () => {
      // No cleanup needed — singleton persists but reset is called on next mount
    };
  }, []);

  /**
   * Sync React state from engine (batched).
   * Called after every recordAdaptiveEvent — but only flushes to React
   * if enough time has passed, preventing excessive re-renders.
   */
  const syncToReact = useCallback(() => {
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return;
    lastSyncRef.current = now;

    const nextParams = adaptiveEngine.getAdaptiveParams();
    const nextScores = adaptiveEngine.getScores();

    setAdaptiveParams(nextParams);
    setConfidenceScore(nextScores.confidenceScore);
    setFatigueIndex(nextScores.fatigueIndex);
    setFrustrationLevel(nextScores.frustrationLevel);
    setSessionMood(nextScores.sessionMood);
  }, []);

  /**
   * Record an interaction and trigger a batched state sync.
   */
  const recordAdaptiveEvent = useCallback(
    (isCorrect: boolean, reactionTimeMs: number, tapCount: number = 1) => {
      adaptiveEngine.recordEvent({ isCorrect, reactionTimeMs, tapCount });
      syncToReact();
    },
    [syncToReact]
  );

  /**
   * Get final session insights — call in finishGame() handler.
   */
  const getAdaptiveInsights = useCallback((): AdaptiveEngineInsights => {
    return adaptiveEngine.getSessionInsights();
  }, []);

  return {
    adaptiveParams,
    sessionMood,
    confidenceScore,
    fatigueIndex,
    frustrationLevel,
    recordAdaptiveEvent,
    getAdaptiveInsights,
  };
}
