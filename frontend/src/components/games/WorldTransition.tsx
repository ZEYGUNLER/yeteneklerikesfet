import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import { immersionSafetyRules } from '@/services/immersionSafetyRules';
import { GameIdentity } from '@/config/gameIdentity.config';

const { width, height } = Dimensions.get('window');

interface WorldTransitionProps {
  isVisible: boolean;
  targetIdentity: GameIdentity | null;
  onTransitionComplete: () => void;
}

/**
 * PHASE G8A — Cinematic World Transition
 *
 * Provides a gentle color sweep when moving between hub and game.
 * Respects Low Motion Mode by shortening duration and simplifying easing.
 */
export const WorldTransition: React.FC<WorldTransitionProps> = ({
  isVisible,
  targetIdentity,
  onTransitionComplete,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible && targetIdentity) {
      const safety = immersionSafetyRules.getSafeConfig();
      const duration = safety.transitionDurationMs;
      
      // If minimal mode, we just do a quick, unblocking cross-fade
      const isMinimal = safety.immersionLevel === 'minimal';

      // Sweep in
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: duration / 2,
        easing: isMinimal ? Easing.linear : Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        // Callback to actually switch the screen routing in the background
        onTransitionComplete();

        // Sweep out
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: duration / 2,
          easing: isMinimal ? Easing.linear : Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isVisible, targetIdentity]);

  if (!isVisible && opacityAnim.interpolate({ inputRange: [0,1], outputRange: [0,1]}) as unknown as number === 0) {
      // Small optimization, but typically handled by parent component unmounting it
  }

  const backgroundColor = targetIdentity ? targetIdentity.colors.primary : '#0A0A15';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          opacity: opacityAnim,
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'} // Block touches ONLY during transition
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999, // Must sit above everything else
  },
});
