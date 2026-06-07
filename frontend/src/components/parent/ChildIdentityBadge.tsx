import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProgression } from '@/context/ProgressionContext';
import { useChildContext } from '@/context/ChildContext';

/**
 * PHASE G8B — Child Identity Badge
 * 
 * Living profile representation.
 * Displays aura colors and active titles as unlocked by the child.
 */
export const ChildIdentityBadge = () => {
  const { data } = useProgression();
  const { selectedChild } = useChildContext();

  if (!selectedChild || !data) return null;

  // Fallback defaults if none selected
  const auraColor = data.activeAura || '#8B5CF6';
  const title = data.activeTitle || 'Genç Kaşif';

  return (
    <View style={styles.container}>
      <View style={[styles.avatarGlow, { backgroundColor: auraColor, shadowColor: auraColor }]} />
      <View style={styles.avatarInner}>
        <Text style={styles.avatarEmoji}>{selectedChild.avatar || '🧑'}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{selectedChild.name}</Text>
        <View style={styles.levelRow}>
          <View style={[styles.levelBadge, { backgroundColor: auraColor }]}>
            <Text style={styles.levelText}>Lv. {data.level}</Text>
          </View>
          <Text style={[styles.titleText, { color: auraColor }]}>{title}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarGlow: {
    position: 'absolute',
    left: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    opacity: 0.5,
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  textContainer: {
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
  },
  titleText: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.9,
  },
});
