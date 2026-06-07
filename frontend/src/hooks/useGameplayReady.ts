/**
 * useGameplayReady — G9-A.1 Architectural Protection
 *
 * Prevents gameplay logic (sequence playback, round start, timer start)
 * from executing before onboarding/tutorial overlays have dismissed.
 *
 * USAGE:
 *   const { isReady, dismissOnboarding, showOnboarding } = useGameplayReady(status);
 *
 *   // In useEffect:
 *   if (isReady) startRound();
 *
 *   // In JSX:
 *   {showOnboarding && <InteractionOnboarding onComplete={dismissOnboarding} />}
 *
 * ARCHITECTURE:
 *   - Combines `useGameSession.status === 'playing'` and `showTutorial === false`
 *   - Returns a single `isReady` boolean — the ONLY gate for gameplay start
 *   - Ensures no gameplay logic fires behind overlay
 *   - Zero risk of stale closure: `isReady` updates reactively
 *
 * RULE: Every game screen with an InteractionOnboarding overlay
 *       MUST use this hook instead of manually checking status/tutorial.
 */

import { useState, useCallback } from 'react';
import type { GameStatus } from './useGameSession';

interface UseGameplayReadyReturn {
  /** True when BOTH session is playing AND onboarding is dismissed */
  isReady: boolean;

  /** Whether the onboarding overlay should render */
  showOnboarding: boolean;

  /** Callback to pass to InteractionOnboarding.onComplete */
  dismissOnboarding: () => void;

  /** Raw session status (passthrough for convenience) */
  status: GameStatus;
}

export function useGameplayReady(status: GameStatus): UseGameplayReadyReturn {
  const [showOnboarding, setShowOnboarding] = useState(true);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const isReady = status === 'playing' && !showOnboarding;

  return {
    isReady,
    showOnboarding,
    dismissOnboarding,
    status,
  };
}
