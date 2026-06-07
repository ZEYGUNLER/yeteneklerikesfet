import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface RewardCeremonyProps {
  type: 'level_up' | 'achievement' | 'unlock';
  title: string;
  subtitle: string;
  icon?: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const RewardCeremony: React.FC<RewardCeremonyProps> = ({ 
  type, 
  title, 
  subtitle, 
  icon,
  onClose 
}) => {
  const { theme, textStyles, spacing, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();

    const timer = setTimeout(() => {
      hide();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const hide = () => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const getColors = () => {
    switch(type) {
      case 'level_up': return [theme.colors.primary, theme.colors.primary + '80'];
      case 'achievement': return [theme.colors.secondary, theme.colors.secondary + '80'];
      case 'unlock': return [theme.colors.success, theme.colors.success + '80'];
      default: return [theme.colors.primary, theme.colors.primary + '80'];
    }
  };

  const colors = getColors();

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors[0], borderRadius: radius.full }]}>
          <Ionicons 
            name={icon as any || (type === 'level_up' ? 'trending-up' : type === 'achievement' ? 'trophy' : 'gift')} 
            size={60} 
            color="white" 
          />
        </View>

        <Text style={[textStyles.label, styles.typeText]}>{type.replace('_', ' ').toUpperCase()}</Text>
        <Text style={[textStyles.h1, styles.title]}>{title}</Text>
        <Text style={[textStyles.body, styles.subtitle]}>{subtitle}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    width: width * 0.8,
    padding: 32,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  typeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  }
});
