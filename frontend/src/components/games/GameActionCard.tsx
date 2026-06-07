import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle, Animated } from 'react-native';

interface GameActionCardProps {
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function GameActionCard({ children, containerStyle }: GameActionCardProps) {
  return (
    <View style={[styles.card, containerStyle]}>
      {children}
    </View>
  );
}

interface GameButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

// Rule 1: microinteraction press = 120–180ms
// Rule 3: useNativeDriver: true always
// Rule 2: scale only, no glow stacking
export function GameButton({ onPress, title, disabled, variant = 'primary' }: GameButtonProps) {
  const isPrimary = variant === 'primary';
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: isPrimary ? 0.97 : 0.96,
      tension: 180,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 180,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          isPrimary ? styles.button : styles.secondaryBtn,
          disabled && (isPrimary ? styles.buttonDisabled : styles.secondaryBtnDisabled),
        ]}
      >
        <Text style={isPrimary ? styles.buttonText : styles.secondaryText}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  secondaryBtnDisabled: {
    opacity: 0.5,
  },
  secondaryText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 15,
  },
});

