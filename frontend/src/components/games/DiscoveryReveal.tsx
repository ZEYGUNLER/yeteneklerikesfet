import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DiscoveryRevealProps {
  worldName: string;
  worldIcon: string;
  primaryColor: string;
  glowColor: string;
  onComplete: () => void;
}

/**
 * DISCOVERY REVEAL — Phase G6
 * A lightweight cinematic that plays once when a new world is first unlocked.
 * Creates the "New Magical World Unlocked" feeling.
 */
export function DiscoveryReveal({
  worldName,
  worldIcon,
  primaryColor,
  glowColor,
  onComplete,
}: DiscoveryRevealProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: fade in + scale up
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: glow pulse
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        // Phase 3: hold for a moment then fade out
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(onComplete);
        }, 1000);
      });
    });
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            borderColor: primaryColor,
            shadowColor: primaryColor,
            opacity: glowOpacity,
          },
        ]}
      />
      {/* Main content card */}
      <Animated.View style={[styles.card, { transform: [{ scale }], borderColor: primaryColor }]}>
        <Text style={styles.badge}>YENİ DÜNYA AÇILDI!</Text>
        <Text style={styles.icon}>{worldIcon}</Text>
        <Text style={[styles.title, { color: primaryColor }]}>{worldName}</Text>
        <View style={[styles.divider, { backgroundColor: primaryColor }]} />
        <Text style={styles.subtitle}>Macera seni bekliyor!</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
  card: {
    backgroundColor: '#0F0F1A',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 12,
    minWidth: 240,
  },
  badge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  icon: {
    fontSize: 56,
    marginVertical: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  divider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
