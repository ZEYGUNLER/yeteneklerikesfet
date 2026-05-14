import { Platform } from 'react-native';

/**
 * Typography System
 * Scales and styles for professional and playful text.
 */

export const typography = {
  fonts: {
    regular: Platform.select({ ios: 'System', android: 'Roboto', web: 'Inter, system-ui' }),
    medium: Platform.select({ ios: 'System', android: 'Roboto-Medium', web: 'Inter, system-ui' }),
    bold: Platform.select({ ios: 'System', android: 'Roboto-Bold', web: 'Inter, system-ui' }),
    black: Platform.select({ ios: 'System', android: 'Roboto-Black', web: 'Inter, system-ui' }),
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  }
};

export const textStyles = {
  h1: {
    fontSize: typography.sizes['3xl'],
    fontWeight: '900' as const,
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
  },
  h2: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800' as const,
    lineHeight: typography.sizes['2xl'] * typography.lineHeights.tight,
  },
  h3: {
    fontSize: typography.sizes.xl,
    fontWeight: '800' as const,
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
  },
  body: {
    fontSize: typography.sizes.md,
    fontWeight: '500' as const,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  bodyBold: {
    fontSize: typography.sizes.md,
    fontWeight: '700' as const,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  caption: {
    fontSize: typography.sizes.sm,
    fontWeight: '600' as const,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};
