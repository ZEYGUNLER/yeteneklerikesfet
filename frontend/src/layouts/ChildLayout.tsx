import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useChildContext } from '@/context/ChildContext';
import { navigationService } from '@/navigation/navigation.service';
import { usePathname } from 'expo-router';
import { ROUTES } from '@/navigation/routes';
import { ThemeProvider } from '@/theme';
import { gameAudioService } from '@/services/gameAudio.service';

interface ChildLayoutProps {
  children: React.ReactNode;
}

/**
 * World 2: CHILD WORLD (The Playground)
 * Atmosphere: Playful, Safe, Immersive, Colorful.
 * No analytics, no admin structures.
 */
export const ChildLayout = ({ children }: ChildLayoutProps) => {
  const { selectedChild, isRestoring } = useChildContext();
  const pathname = usePathname();

  // Child Guard: Protect all child routes except profile picker.
  // Wait until isRestoring is false so AsyncStorage has been read.
  useEffect(() => {
    const isProfilePicker = pathname === ROUTES.PROFILE_PICKER;
    if (isRestoring || isProfilePicker) return;
    if (!selectedChild) {
      if (__DEV__) console.log('[ChildGuard] No child selected, redirecting to picker');
      navigationService.goToProfilePicker('child_guard_active');
    }
  }, [selectedChild, pathname, isRestoring]);

  // Safety Layer: Proactively redirect away from parent routes if accidentally entered
  useEffect(() => {
    const isParentRoute = pathname.includes('/dashboard') || pathname.includes('/children');
    if (isParentRoute) {
      if (__DEV__) console.log('[ChildSafety] Parent route detected in Child World, escaping...');
      navigationService.goToProfilePicker('child_safety_trigger');
    }
  }, [pathname]);

  // Global Game Feel Cleanup: Ensure audio resources are released when world changes
  useEffect(() => {
    return () => {
      void gameAudioService.cleanup();
    };
  }, []);

  return (
    <ThemeProvider world="child">
      <View style={styles.container}>
        {/* Playful background blobs */}
        <View style={styles.blobPurple} />
        <View style={styles.blobTeal} />
        <View style={styles.blobOrange} />
        
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
    backgroundColor: '#0F172A', // Deep space blue for immersion
  },
  blobPurple: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#7C3AED',
    opacity: 0.12,
  },
  blobTeal: {
    position: 'absolute',
    bottom: 40,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#0D9488',
    opacity: 0.08,
  },
  blobOrange: {
    position: 'absolute',
    top: '30%',
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F59E0B',
    opacity: 0.05,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
