import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { interactionConfig } from '../config/interaction.config';

export const interactionEngine = {
  // Safe Haptic Wrappers
  triggerSuccess: () => {
    if (Platform.OS === 'web' || !interactionConfig.enableHaptics) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },

  triggerError: () => {
    if (Platform.OS === 'web' || !interactionConfig.enableHaptics) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },

  triggerWarning: () => {
    if (Platform.OS === 'web' || !interactionConfig.enableHaptics) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },

  triggerLightTap: () => {
    if (Platform.OS === 'web' || !interactionConfig.enableHaptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  triggerMediumTap: () => {
    if (Platform.OS === 'web' || !interactionConfig.enableHaptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },

  triggerHeavyTap: () => {
    if (Platform.OS === 'web' || !interactionConfig.enableHaptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },

  // Gesture Helper: Forgiving Swipe Direction Calculation
  // Returns 'UP', 'DOWN', 'LEFT', 'RIGHT', or null if the swipe is invalid or below threshold
  calculateSwipeDirection: (translationX: number, translationY: number, velocityX: number, velocityY: number) => {
    const absX = Math.abs(translationX);
    const absY = Math.abs(translationY);

    if (Math.max(absX, absY) < interactionConfig.swipe.minDistance) return null;

    // Determine direction based on the larger translation vector
    if (absX > absY) {
      if (Math.abs(velocityX) < interactionConfig.swipe.velocityThreshold) return null;
      return translationX > 0 ? 'RIGHT' : 'LEFT';
    } else {
      if (Math.abs(velocityY) < interactionConfig.swipe.velocityThreshold) return null;
      return translationY > 0 ? 'DOWN' : 'UP';
    }
  },

  // Fallback Check
  shouldFallbackToTap: () => {
    return Platform.OS === 'web' && interactionConfig.fallbackToTapOnWeb;
  }
};
