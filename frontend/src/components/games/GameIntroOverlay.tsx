import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated, Text, View, Dimensions } from 'react-native';
import { getIdentity, GameIdentityType } from '@/config/gameIdentity.config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameIntroOverlayProps {
  gameId: GameIdentityType;
  onFinish: () => void;
}

/**
 * Identity-aware introduction overlay.
 * Provides a thematic "entry moment" for each game world.
 */
export const GameIntroOverlay = ({ gameId, onFinish }: GameIntroOverlayProps) => {
  const identity = getIdentity(gameId);
  const [visible, setVisible] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(textSlide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after delay
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onFinish();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: identity.colors.background,
            borderColor: identity.colors.accent,
          }
        ]}
      >
        <Text style={styles.icon}>{identity.intro.icon}</Text>
        <Text style={[
          styles.worldName, 
          { color: identity.colors.accent }
        ]}>
          {identity.worldName}
        </Text>
        <Animated.View style={{ transform: [{ translateY: textSlide }] }}>
           <Text style={styles.description}>{identity.intro.description}</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 340,
    padding: 40,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  worldName: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontSize: 18,
    color: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '600',
  },
});
