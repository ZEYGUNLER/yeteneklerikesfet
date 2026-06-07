import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '@/theme';

interface ScreenLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export const ScreenLoader = ({ label, fullScreen = true }: ScreenLoaderProps) => {
  const { theme, spacing, textStyles } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[
      styles.container, 
      fullScreen && styles.fullScreen,
      { backgroundColor: theme.colors.background }
    ]}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {label && (
          <Text style={[
            textStyles.body, 
            { color: theme.colors.textSecondary, marginTop: spacing.md }
          ]}>
            {label}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});
