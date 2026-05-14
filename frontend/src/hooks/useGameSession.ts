import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { navigationService } from '@/navigation/navigation.service';
import { ROUTES } from '@/navigation/routes';
import { useChildContext } from '@/context/ChildContext';
import { gameService } from '@/services/game.service';
import { getApiErrorMessage } from '@/utils/apiError';
import { useQueryClient } from '@tanstack/react-query';

export type GameStatus = 'starting' | 'playing' | 'ending' | 'error';

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
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<GameStatus>('starting');
  const [error, setError] = useState<string | null>(null);

  const startedAtRef = useRef<number>(Date.now());
  const isEndingRef = useRef(false);

  useEffect(() => {
    const startSession = async () => {
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
        const session = await gameService.start({ childId: selectedChild.id, gameId });
        setSessionId(session.sessionId);
        startedAtRef.current = Date.now();
        setStatus('playing');
      } catch (e) {
        setError(getApiErrorMessage(e, 'Unable to start game session.'));
        setStatus('error');
      }
    };

    startSession();
  }, [gameId, selectedChild?.id]);

  const finishGame = useCallback(async (result: GameResult) => {
    if (isEndingRef.current || !sessionId || !selectedChild?.id) return;
    
    isEndingRef.current = true;
    setStatus('ending');

    try {
      const durationSeconds = result.duration ?? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));
      
      await gameService.end({
        sessionId,
        score: result.score,
        duration: durationSeconds,
        accuracy: result.accuracy,
        metadata: result.metadata,
      });

      await queryClient.invalidateQueries({ queryKey: ['dashboard', selectedChild.id] });

      navigationService.goToGameSummary({
        score: result.score,
        duration: durationSeconds,
        accuracy: result.accuracy,
        level: result.metadata?.highestLevel || 0,
        perfectRounds: result.metadata?.perfectRounds || 0,
        totalRounds: result.metadata?.totalRounds || 0,
      });
    } catch (e) {
      isEndingRef.current = false;
      setError(getApiErrorMessage(e, 'Unable to submit game results.'));
      setStatus('error');
    }
  }, [sessionId, selectedChild?.id, queryClient]);

  return {
    status,
    sessionId,
    error,
    finishGame,
    startTime: startedAtRef.current,
  };
}
