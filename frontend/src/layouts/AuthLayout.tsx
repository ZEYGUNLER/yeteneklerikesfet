import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { ThemeProvider } from '@/theme';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * World 1: AUTH WORLD
 * Atmosphere: Clean, Calm, Focused.
 * No gameplay elements, no admin complexity.
 */
export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <ThemeProvider world="parent">
      <View style={styles.container}>
        {/* Subtle calm background blobs if needed, or just clean surface */}
        <View style={styles.background} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {children}
          </View>
        </SafeAreaView>
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Calm gray-white
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    maxWidth: Platform.OS === 'web' ? 450 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : 'auto',
    width: '100%',
  },
});
