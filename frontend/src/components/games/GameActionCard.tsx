import React from 'react';
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';

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

export function GameButton({ onPress, title, disabled, variant = 'primary' }: GameButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        isPrimary ? styles.button : styles.secondaryBtn,
        disabled && (isPrimary ? styles.buttonDisabled : styles.secondaryBtnDisabled),
        pressed && (isPrimary ? styles.buttonPressed : styles.secondaryBtnPressed),
      ]}
    >
      <Text style={isPrimary ? styles.buttonText : styles.secondaryText}>{title}</Text>
    </Pressable>
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
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.1,
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
  secondaryBtnPressed: {
    backgroundColor: '#F3F4F6',
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
