import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { GAME_FEEL_CONFIG } from '@/config/gameFeel.config';
import { getIdentity, GameIdentity } from '@/config/gameIdentity.config';

interface StatItem {
  label: string;
  value: string | number;
}

interface GameHeaderProps {
  title: string;
  stats: StatItem[];
  progress?: number;
  gameId?: string;
}

export function GameHeader({ title, stats, progress, gameId }: GameHeaderProps) {
  const identity = getIdentity(gameId || 'attention');
  const progressAnim = useRef(new Animated.Value(progress || 0)).current;

  useEffect(() => {
    if (progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: GAME_FEEL_CONFIG.durations.progressBar,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, progressAnim]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>{title}</Text>
        {progress !== undefined && (
          <View style={[styles.progressBarContainer, { backgroundColor: identity.colors.secondary + '40' }]}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { 
                  width: widthInterpolation,
                  backgroundColor: identity.colors.accent 
                }
              ]} 
            />
          </View>
        )}
      </View>
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <StatCard 
            key={`${stat.label}-${index}`} 
            label={stat.label} 
            value={stat.value} 
            identity={identity}
          />
        ))}
      </View>
    </View>
  );
}

function StatCard({ label, value, identity }: StatItem & { identity: GameIdentity }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastValue = useRef(value);

  useEffect(() => {
    if (lastValue.current !== value) {
      lastValue.current = value;
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [value, scaleAnim]);

  return (
    <Animated.View style={[
      styles.stat, 
      { 
        transform: [{ scale: scaleAnim }],
        backgroundColor: identity.colors.surface,
        borderColor: identity.colors.accent + '30'
      }
    ]}>
      <Text style={[styles.statLabel, { color: identity.colors.accent + '80' }]}>{label}</Text>
      <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    flexShrink: 1,
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 10,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
});
