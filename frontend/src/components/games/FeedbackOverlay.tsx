import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Text, View } from 'react-native';
import { GAME_FEEL_CONFIG } from '@/config/gameFeel.config';
import { getIdentity, GameIdentityType } from '@/config/gameIdentity.config';

interface FeedbackOverlayProps {
  text: string | null;
  gameId?: string;
}

/**
 * Identity-aware animated overlay for motivational feedback.
 * Adapts colors and styling to match the active game world.
 */
export const FeedbackOverlay = ({ text, gameId }: FeedbackOverlayProps) => {
  const identity = getIdentity(gameId || 'attention');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (text) {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const outTimer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, GAME_FEEL_CONFIG.durations.feedbackText - 300);

      return () => clearTimeout(outTimer);
    }
  }, [text, fadeAnim, slideAnim]);

  if (!text) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.bubble,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: identity.colors.surface,
            borderColor: identity.colors.accent,
            shadowColor: identity.colors.accent,
          },
        ]}
      >
        <Text style={[styles.text, { color: '#FFFFFF' }]}>{text}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  bubble: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 40,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
  },
  text: {
    fontSize: 30,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
