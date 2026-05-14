import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Text, View } from 'react-native';
import { getIdentity } from '@/config/gameIdentity.config';

interface ComboMomentumOverlayProps {
  combo: number;
  gameId: string;
}

/**
 * Visual display for gameplay combos and momentum.
 * Appears dynamically when a streak is active to reinforce mastery feeling.
 */
export const ComboMomentumOverlay = ({ combo, gameId }: ComboMomentumOverlayProps) => {
  const identity = getIdentity(gameId);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const lastCombo = useRef(combo);

  useEffect(() => {
    if (combo > 0) {
      // "Pop" animation on combo increase
      scaleAnim.setValue(1);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    } else {
      // Fade out on reset
      Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    lastCombo.current = combo;
  }, [combo, scaleAnim]);

  if (combo < 2) return null; // Only show for streaks of 2 or more

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ scale: scaleAnim }],
          backgroundColor: identity.colors.accent,
          borderColor: '#FFFFFF',
        }
      ]}
    >
      <Text style={[styles.text, { color: identity.colors.secondary }]}>
        {combo}X KOMBO
      </Text>
      <View style={[styles.glow, { backgroundColor: identity.colors.accent }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100, // Positioned below the header
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
    zIndex: -1,
  },
});
