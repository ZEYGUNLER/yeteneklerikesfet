import { useState, useCallback, useRef } from 'react';
import { GAME_FEEL_CONFIG } from '@/config/gameFeel.config';
import { GAME_LOOP_CONFIG } from '@/config/gameLoop.config';
import { gameAudioService } from '@/services/gameAudio.service';
import { getIdentity } from '@/config/gameIdentity.config';
import type { SafeAdaptiveParams } from '@/services/adaptiveSafetyRules';
import { mascotEngine } from '@/services/mascotEngine';

interface FeedbackState {
  text: string;
  id: number;
  type: 'praise' | 'combo' | 'mastery' | 'support';
}

/** Support-mode recovery messages — warm, non-patronizing, child-centered */
const SUPPORT_MESSAGES = [
  'Neredeyse! 💪',
  'Tekrar Dene! 🌟',
  'Devam Et! ✨',
  'Güçlüsün! 🦋',
  'Olmak Üzere! 🎯',
];

/**
 * Enhanced Hook to manage the Gameplay Loop rhythm and motivational feedback.
 * Tracks streaks, combos, momentum, and mastery moments.
 *
 * Phase G7: Accepts optional encouragementMode from useAdaptiveEngine
 * for emotionally-aware feedback tuning.
 */
export function useGameFeedback(
  gameId?: string,
  encouragementMode: SafeAdaptiveParams['encouragementMode'] = 'neutral'
) {
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

      // Phase G7: In support mode, show a gentle recovery message
      if (encouragementMode === 'support') {
        const msg = SUPPORT_MESSAGES[Math.floor(Math.random() * SUPPORT_MESSAGES.length)];
        setFeedback({ text: msg, id: now, type: 'support' });
        
        // Phase G8A: Mascot provides emotional support
        mascotEngine.triggerState('support', msg, 3000);

        setTimeout(() => {
          setFeedback((prev) => (prev?.id === now ? null : prev));
        }, GAME_FEEL_CONFIG.durations.feedbackText);
      } else {
        // Phase G8A: If not explicitly in support mode, mascot might just look curious/encouraging
        if (Math.random() > 0.5) mascotEngine.triggerState('curious');
      }
      return;
    }

    // 2. Handle Perfect Round (Mastery)
    if (type === 'perfect_round') {
      console.log('[G9-AUDIT-FEEDBACK] triggerFeedback(perfect_round) called');
      console.log('[BUILD CHECK] perfect_round autoclear active');
      setPerfectRounds(prev => prev + 1);
      setFeedback({ 
        text: 'Kusursuz Tur! ✨', 
        id: now, 
        type: 'mastery' 
      });
      console.log('[G9-AUDIT-FEEDBACK] Feedback state set to Kusursuz Tur! ✨ (id:', now, ')');
      void gameAudioService.playEffect('reward', identity.audio.profile);
      
      // Phase G8A: Mascot celebrates perfect round
      mascotEngine.triggerState('celebrate', 'Harika!', 4000);

      // G9-A.2 FIX: Auto-clear feedback — without this, !!feedback guard in handleTilePress
      // permanently blocks all user input after the first successful round
      console.log('[G9-AUDIT-FEEDBACK] Auto-clear timeout starting for', GAME_FEEL_CONFIG.durations.feedbackText, 'ms');
      setTimeout(() => {
        console.log('[G9-AUDIT-FEEDBACK] Auto-clear timeout fired for id:', now);
        setFeedback(prev => {
          const isMatch = prev?.id === now;
          console.log('[G9-AUDIT-FEEDBACK] Clearing feedback. Was matching current id?', isMatch);
          return isMatch ? null : prev;
        });
      }, GAME_FEEL_CONFIG.durations.feedbackText);
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
    let feedbackType: 'praise' | 'combo' | 'mastery' | 'support' = 'praise';

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
      // Phase G7: In celebrate mode, even fast reactions get extra flair
      text = encouragementMode === 'celebrate' ? 'Süper Hız! ⚡🔥' : 'Işık Hızı! ⚡';
    } else if (currentStreak >= GAME_LOOP_CONFIG.combos.thresholds.super) {
      // Phase G7: In support mode, lower combo thresholds also get praise
      text = encouragementMode === 'celebrate' ? 'Muhteşem! 🌈' : 'Süper! 👍';
    } else if (encouragementMode === 'support' && currentStreak >= 1) {
      // Phase G7: Support mode — even a single correct answer earns praise
      text = 'Aferin! ⭐';
    }

    if (text) {
      setFeedback({ text, id: now, type: feedbackType });
      lastPraiseTimeRef.current = now;

      // Phase G8A: Mascot occasionally joins in on combo/praise
      if (feedbackType === 'combo' && Math.random() > 0.3) {
        mascotEngine.triggerState('celebrate', text, 3000);
      }

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
