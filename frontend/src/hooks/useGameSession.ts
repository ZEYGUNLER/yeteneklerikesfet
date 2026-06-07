import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { navigationService } from '@/navigation/navigation.service';
import { ROUTES } from '@/navigation/routes';
import { useChildContext } from '@/context/ChildContext';
import { useProgression } from '@/context/ProgressionContext';
import { gameService } from '@/services/game.service';
import { progressionEngine } from '@/services/progressionEngine';
import { getApiErrorMessage } from '@/utils/apiError';
import { useQueryClient } from '@tanstack/react-query';
import { syncService } from '@/services/sync.service';

export type GameStatus = 'starting' | 'playing' | 'ending' | 'error';

const SESSION_START_TIMEOUT_MS = 15_000;

interface UseGameSessionProps {
  gameId: string;
}

interface GameResult {
  score: number;
  accuracy: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export function useGameSession({ gameId }: UseGameSessionProps) {
  const { selectedChild } = useChildContext();
  const { addXP } = useProgression();
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<GameStatus>('starting');
  const [error, setError] = useState<string | null>(null);

  const startedAtRef = useRef<number>(Date.now());
  // ADD-02: prevents double finishGame submissions (double-tap, rapid nav, lag)
  const isEndingRef = useRef(false);
  // BUG-02: prevents duplicate session starts on remount / React Strict Mode
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const startSession = async () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      if (!selectedChild?.id) {
        if (Platform.OS === 'web') {
          navigationService.goToDashboard('missing_child_session');
        } else {
          navigationService.goToProfilePicker('missing_child_session');
        }
        return;
      }

      try {
        setError(null);
        setStatus('starting');

        // ADD-03: 15s timeout — prevents infinite loading if backend is unreachable
        const session = await Promise.race([
          gameService.start({ childId: selectedChild.id, gameId }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Bağlantı zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.')), SESSION_START_TIMEOUT_MS),
          ),
        ]);

        setSessionId(session.sessionId);
        startedAtRef.current = Date.now();
        setStatus('playing');
      } catch (e) {
        setError(getApiErrorMessage(e, 'Oyun oturumu başlatılamadı.'));
        setStatus('error');
      }
    };

    startSession();
  }, [gameId, selectedChild?.id]);

  // BUG-03: addXP added to dependency array to prevent stale closure
  const finishGame = useCallback(async (result: GameResult, skipNavigation = false) => {
    // ── G9-C.1 DEBUG ──
    console.log('[G9-C1-FINISH] finishGame called', { sessionId, childId: selectedChild?.id, score: result.score, accuracy: result.accuracy });
    // ── END DEBUG ──
    // ADD-02: hard guard — finishGame executes at most once per session lifecycle
    if (isEndingRef.current || !sessionId || !selectedChild?.id) {
      console.log('[G9-C1-FINISH] EARLY RETURN — guard hit', { isEnding: isEndingRef.current, sessionId, childId: selectedChild?.id });
      return null;
    }

    isEndingRef.current = true;
    setStatus('ending');

    try {
      const durationSeconds = result.duration ?? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));
      console.log('[G9-C1-FINISH] step 1: calling gameService.end', { sessionId, score: result.score, accuracy: result.accuracy, duration: durationSeconds });

      const sessionPayload = {
        sessionId,
        score: result.score,
        duration: durationSeconds,
        accuracy: result.accuracy,
        metadata: result.metadata,
      };

      let endResult: any;
      try {
        endResult = await gameService.end(sessionPayload);
        console.log('[G9-C1-FINISH] step 1 ✅ gameService.end OK', endResult);
      } catch (endErr: any) {
        console.warn('[G9-C1-FINISH] step 1 ⚠️ gameService.end FAILED (Fire-and-forget). Queuing session payload locally.', {
          status: endErr?.response?.status,
          isNetwork: !endErr?.response,
        });
        // Save to AsyncStorage pending sync queue
        await syncService.queueSession(sessionPayload);
      }

      console.log('[G9-C1-FINISH] step 2: invalidating dashboard query');
      try {
        await queryClient.invalidateQueries({ queryKey: ['dashboard', selectedChild.id] });
        console.log('[G9-C1-FINISH] step 2 ✅ query invalidated');
      } catch (qErr) {
        console.warn('[G9-C1-FINISH] step 2 ⚠️ query invalidate FAILED (Ignored)');
      }

      console.log('[G9-C1-FINISH] step 3: calculating XP');
      const earnedXP = progressionEngine.calculateGameXP(
        result.score,
        result.accuracy,
        durationSeconds
      );
      console.log('[G9-C1-FINISH] step 3 ✅ earnedXP =', earnedXP);

      console.log('[G9-C1-FINISH] step 4: calling addXP');
      let progResult: { leveledUp: boolean; newAchievements: string[]; newUnlocks: string[] } = { leveledUp: false, newAchievements: [], newUnlocks: [] };
      try {
        const xpRes = await addXP(earnedXP, {
          score: result.score,
          accuracy: result.accuracy,
          comboCount: result.metadata?.highestCombo || 0,
          isPerfect: (result.metadata?.perfectRounds || 0) === (result.metadata?.totalRounds || 0) && (result.metadata?.totalRounds || 0) > 0,
          gameId,
        });
        progResult = xpRes;
        console.log('[G9-C1-FINISH] step 4 ✅ addXP OK', progResult);
      } catch (xpErr: any) {
        console.warn('[G9-C1-FINISH] step 4 ⚠️ addXP FAILED (Fire-and-forget)', xpErr?.message);
      }

      const summaryPayload = {
        score: result.score,
        duration: durationSeconds,
        accuracy: result.accuracy,
        totalCorrect: result.metadata?.correct || 0,
        longestSequence: result.metadata?.longestSequence || 0,
        starsEarned: result.metadata?.starsEarned || 0,
        earnedXP,
        leveledUp: progResult.leveledUp ? 1 : 0,
        newAchievements: progResult.newAchievements.join(','),
        newUnlocks: progResult.newUnlocks.join(','),
        gameType: result.metadata?.gameType || gameId,
        attentionScore: result.metadata?.attentionScore,
        inhibitionScore: result.metadata?.inhibitionScore,
        avgReactionTime: result.metadata?.avgReactionTime,
        bestStreak: result.metadata?.bestStreak,
      };

      if (skipNavigation) {
        setStatus('playing');
        isEndingRef.current = false;
        return summaryPayload;
      }

      console.log('[G9-C1-FINISH] step 5: navigating to summary');
      try {
        navigationService.goToGameSummary(summaryPayload);
        console.log('[G9-C1-FINISH] step 5 ✅ navigation to summary fired');
        return summaryPayload;
      } catch (navErr: any) {
        console.error('[G9-C1-FINISH] step 5 ❌ navigation FAILED', navErr?.message);
        throw navErr;
      }
    } catch (e) {
      console.error('[G9-C1-FINISH] ❌ Critical failure during game finish', e);
      // Fallback: If EVERYTHING fails, reset lock but don't show error screen. Just try to force navigation.
      isEndingRef.current = false;
      const fallbackPayload = {
        score: result.score,
        duration: 0,
        accuracy: result.accuracy,
        totalCorrect: result.metadata?.correct || 0,
        longestSequence: result.metadata?.longestSequence || 0,
        starsEarned: result.metadata?.starsEarned || 0,
        earnedXP: 0,
        leveledUp: 0,
        newAchievements: '',
        newUnlocks: '',
        gameType: gameId,
      };
      if (skipNavigation) {
        return fallbackPayload;
      }
      try {
        navigationService.goToGameSummary(fallbackPayload);
        return fallbackPayload;
      } catch (fallbackErr) {
        setError('Oyun sonuçları işlenirken beklenmeyen bir hata oluştu.');
        setStatus('error');
        return null;
      }
    }
  }, [sessionId, selectedChild?.id, queryClient, addXP, gameId]);

  return {
    status,
    sessionId,
    error,
    finishGame,
    startTime: startedAtRef.current,
  };
}

