import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GAME_FEEL_CONFIG } from '@/config/gameFeel.config';

interface ObservationHUDProps {
  metrics: any;
  streak: number;
}

/**
 * Debug helper to observe game feel parameters in real-time.
 * Only renders if enableGameplayDebug is true in config.
 */
export const ObservationHUD = ({ metrics, streak }: ObservationHUDProps) => {
  if (!GAME_FEEL_CONFIG.debug.enableGameplayDebug) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>OBSERVATION MODE</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Streak:</Text>
        <Text style={styles.value}>{streak}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Accuracy:</Text>
        <Text style={styles.value}>{(metrics.accuracy * 100).toFixed(1)}%</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Avg React:</Text>
        <Text style={styles.value}>{metrics.avgReactionTime || '---'}ms</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Fatigue:</Text>
        <Text style={styles.value}>{metrics.fatigueIndex?.toFixed(2) || '---'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBBF24',
    zIndex: 10000,
    minWidth: 140,
  },
  title: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 2,
  },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  value: {
    color: '#F1F5F9',
    fontSize: 10,
    fontWeight: '900',
  },
});
