import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, Platform } from 'react-native';
import { ScreenContainer } from '../common/ScreenContainer';
import { EnvironmentEffect } from './EnvironmentEffect';
import { getIdentity } from '@/config/gameIdentity.config';

interface GameLayoutProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  gameId?: string;
}

/**
 * Standardized layout for all games.
 * Now identity-aware: adapts background and atmospheric effects based on gameId.
 */
export function GameLayout({ children, contentContainerStyle, gameId }: GameLayoutProps) {
  const identity = getIdentity(gameId || 'attention');

  return (
    <ScreenContainer 
      contentContainerStyle={[
        styles.container, 
        { backgroundColor: identity.colors.background },
        contentContainerStyle
      ]}
    >
      <EnvironmentEffect identity={identity} />
      <View style={styles.inner}>
        {children}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    flex: 1,
  },
  inner: {
    flex: 1,
    gap: 20,
    paddingBottom: 20,
    zIndex: 10, // Ensure game content is above environment effects
  },
});
