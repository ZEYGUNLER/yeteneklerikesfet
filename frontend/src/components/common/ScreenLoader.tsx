import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme';

interface ScreenLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export const ScreenLoader = ({ label, fullScreen = true }: ScreenLoaderProps) => {
  const { theme, spacing, textStyles } = useTheme();

  return (
    <View style={[
      styles.container, 
      fullScreen && styles.fullScreen,
      { backgroundColor: theme.colors.background }
    ]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {label && (
        <Text style={[
          textStyles.body, 
          { color: theme.colors.textSecondary, marginTop: spacing.md }
        ]}>
          {label}
        </Text>
      )}
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
