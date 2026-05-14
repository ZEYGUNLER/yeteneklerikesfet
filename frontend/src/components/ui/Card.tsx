import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outline' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card = ({
  children,
  variant = 'elevated',
  padding = 'lg',
  style,
  radius: customRadius,
}: CardProps) => {
  const { theme, spacing, radius: themeRadius } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return spacing.sm;
      case 'md': return spacing.md;
      case 'xl': return spacing.xl;
      default: return spacing.lg;
    }
  };

  const getRadius = () => {
    if (customRadius === 'none') return 0;
    if (customRadius) return themeRadius[customRadius];
    return theme.radius.card;
  };

  return (
    <View 
      style={[
        styles.base,
        { 
          backgroundColor: theme.colors.card,
          padding: getPadding(),
          borderRadius: getRadius(),
          borderColor: theme.colors.border,
        },
        variant === 'elevated' && theme.shadows.sm,
        variant === 'outline' && { borderWidth: 1 },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
