import { useState, useCallback, useRef } from 'react';
import { GAME_FEEL_CONFIG } from '@/config/gameFeel.config';
import { GAME_LOOP_CONFIG } from '@/config/gameLoop.config';
import { gameAudioService } from '@/services/gameAudio.service';
import { getIdentity } from '@/config/gameIdentity.config';

interface FeedbackState {
  text: string;
  id: number;
  type: 'praise' | 'combo' | 'mastery';
}

/**
 * Enhanced Hook to manage the Gameplay Loop rhythm and motivational feedback.
 * Tracks streaks, combos, momentum, and mastery moments.
 */
export function useGameFeedback(gameId?: string) {
  const identity = getIdentity(gameId || 'attention');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [combo, setCombo] = useState(0);
  const [perfectRounds, setPerfectRounds] = useState(0);
  
  const lastPraiseTimeRef = useRef<number>(0);
  const streakRef = useRef<number>(0);
  const momentumRef = useRef<number>(1); // 1.0 = normal, scales with performance

  const triggerFeedback = useCallback((
    type: 'correct' | 'incorrect' | 'perfect_round', 
    metadata?: { reactionTime?: number }
  ) => {
    const now = Date.now();
    
    // 1. Handle Fail / Incorrect
    if (type === 'incorrect') {
      streakRef.current = 0;
      setCombo(0);
      momentumRef.current = 1.0;
      void gameAudioService.playEffect('fail', identity.audio.profile);
      return;
    }

    // 2. Handle Perfect Round (Mastery)
    if (type === 'perfect_round') {
      setPerfectRounds(prev => prev + 1);
      setFeedback({ 
        text: 'Kusursuz Tur! ✨', 
        id: now, 
        type: 'mastery' 
      });
      void gameAudioService.playEffect('reward', identity.audio.profile);
      return;
    }

    // 3. Handle Correct Interaction
    streakRef.current += 1;
    const currentStreak = streakRef.current;
    setCombo(currentStreak);
    
    // Scale momentum slightly for "Feel" (emotional difficulty)
    momentumRef.current = Math.min(2.0, 1.0 + (currentStreak * GAME_LOOP_CONFIG.pacing.accelerationFactor));

    void gameAudioService.playEffect('success', identity.audio.profile);

    // 4. Determine Praise Level (Throttled)
    if (now - lastPraiseTimeRef.current < GAME_FEEL_CONFIG.praise.cooldown) {
      return;
    }

    let text = '';
    let feedbackType: 'praise' | 'combo' = 'praise';

    // Priority 1: High Combos
    if (currentStreak === GAME_LOOP_CONFIG.combos.thresholds.master) {
      text = 'Efsanevi! 🏆';
      feedbackType = 'combo';
    } else if (currentStreak === GAME_LOOP_CONFIG.combos.thresholds.ultra) {
      text = 'Mükemmel! 🌟';
      feedbackType = 'combo';
    } else if (currentStreak === GAME_LOOP_CONFIG.combos.thresholds.mega) {
      text = 'Harika! 🔥';
      feedbackType = 'combo';
    } 
    // Priority 2: Speed / General Praise
    else if (metadata?.reactionTime && metadata.reactionTime < GAME_FEEL_CONFIG.praise.fastThreshold) {
      text = 'Işık Hızı! ⚡';
    } else if (currentStreak >= GAME_LOOP_CONFIG.combos.thresholds.super) {
      text = 'Süper! 👍';
    }

    if (text) {
      setFeedback({ text, id: now, type: feedbackType });
      lastPraiseTimeRef.current = now;

      // Auto-clear feedback
      setTimeout(() => {
        setFeedback(prev => prev?.id === now ? null : prev);
      }, GAME_FEEL_CONFIG.durations.feedbackText);
    }
  }, [identity]);

  return {
    feedback,
    triggerFeedback,
    streak: streakRef.current,
    combo,
    perfectRounds,
    momentum: momentumRef.current,
  };
}
