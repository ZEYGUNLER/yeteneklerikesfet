import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

type InteractionType = 'swipe' | 'hold' | 'trace';

interface InteractionOnboardingProps {
  type: InteractionType;
  onComplete: () => void;
  message?: string;
}

export function InteractionOnboarding({ type, onComplete, message }: InteractionOnboardingProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto dismiss after a short duration so it's non-blocking
    const timer = setTimeout(() => {
      dismiss();
    }, 2000); // 2-second onboarding

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onComplete();
    });
  };

  if (!isVisible) return null;

  let iconName: any = 'hand-left-outline';
  let defaultMessage = '';

  switch (type) {
    case 'swipe':
      iconName = 'swap-horizontal-outline';
      defaultMessage = 'Parmağını Kaydır';
      break;
    case 'hold':
      iconName = 'finger-print-outline';
      defaultMessage = 'Basılı Tut';
      break;
    case 'trace':
      iconName = 'git-commit-outline';
      defaultMessage = 'Yolu Çiz';
      break;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <TouchableOpacity 
        style={styles.container} 
        activeOpacity={1} 
        onPress={dismiss} // Skippable
      >
        <Animated.View style={[
          styles.hintBox, 
          { 
            backgroundColor: theme.colors.surface, 
            opacity: opacityAnim,
            transform: [{ scale: pulseAnim }]
          }
        ]}>
          <Ionicons name={iconName} size={48} color={theme.colors.primary} />
          <Text style={[styles.message, { color: theme.colors.text }]}>
            {message || defaultMessage}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Render above gameplay
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Very light backdrop
  },
  hintBox: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  message: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
