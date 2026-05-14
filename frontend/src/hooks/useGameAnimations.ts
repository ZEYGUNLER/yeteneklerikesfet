import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { GAME_FEEL_CONFIG } from '@/config/gameFeel.config';

/**
 * Reusable animation hooks for Game Feel.
 * Focuses on performance by using Native Driver and proper cleanup.
 */
export function useGameAnimations() {
  const popAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /**
   * Quick pop effect for buttons or disappearing targets.
   */
  const triggerPop = useCallback((toValue = GAME_FEEL_CONFIG.intensities.popScale) => {
    Animated.sequence([
      Animated.timing(popAnim, {
        toValue,
        duration: GAME_FEEL_CONFIG.durations.pop,
        useNativeDriver: true,
      }),
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [popAnim]);

  /**
   * Shake effect for errors or missing targets.
   */
  const triggerShake = useCallback(() => {
    const distance = GAME_FEEL_CONFIG.intensities.shakeDistance;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: distance, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -distance, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: distance, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  /**
   * Continuous pulse effect for highlighted items.
   */
  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  return {
    values: {
      pop: popAnim,
      shake: shakeAnim,
      pulse: pulseAnim,
    },
    actions: {
      triggerPop,
      triggerShake,
      startPulse,
      stopPulse,
    }
  };
}
