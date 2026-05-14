import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, View, Dimensions } from 'react-native';
import { GameIdentity } from '@/config/gameIdentity.config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnvironmentEffectProps {
  identity: GameIdentity;
}

/**
 * Lightweight, identity-aware atmospheric effect component.
 * Renders subtle floating particles or ambient glows without blocking the JS thread.
 */
export const EnvironmentEffect = ({ identity }: EnvironmentEffectProps) => {
  const particles = Array.from({ length: identity.particles.count });

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((_, i) => (
        <Particle 
          key={i} 
          color={identity.particles.color} 
          type={identity.particles.type} 
        />
      ))}
      <View style={[styles.glow, { backgroundColor: identity.colors.glow }]} />
    </View>
  );
};

const Particle = ({ color, type }: { color: string, type: string }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  // Random start positions and durations for variation
  const startX = Math.random() * SCREEN_WIDTH;
  const startY = Math.random() * SCREEN_HEIGHT;
  const duration = 4000 + Math.random() * 6000;

  useEffect(() => {
    const runAnimation = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start(() => runAnimation());
    };
    runAnimation();
  }, [anim, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100 - Math.random() * 100],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.2],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          backgroundColor: color,
          opacity: opacity,
          transform: [{ translateY }, { scale }],
          borderRadius: type === 'lightning' ? 2 : 10,
          width: type === 'lightning' ? 4 : 8,
          height: type === 'lightning' ? 12 : 8,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  glow: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    right: -100,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: SCREEN_WIDTH,
    opacity: 0.3,
  },
});
