import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '@/theme/tokens';
import { useProgression } from '@/context/ProgressionContext';
import { navigationService } from '@/navigation/navigation.service';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useTheme } from '@/theme';
import { getAllGames, type GameBlueprint } from '@/config/gameBlueprint';
import { DiscoveryReveal } from '@/components/games/DiscoveryReveal';
import { preloadUnlockedGames } from '@/services/assetPreloader';
import { WorldTransition } from '@/components/games/WorldTransition';
import { getIdentity } from '@/config/gameIdentity.config';
import { ChildIdentityBadge } from '@/components/parent/ChildIdentityBadge';
import { seasonalEngine } from '@/services/seasonalEngine';
import { LANDMARKS } from '@/services/worldMemoryEngine';

const { width } = Dimensions.get('window');

const MASTERY_COLORS = ['transparent', '#CD7F32', '#C0C0C0', '#FFD700'];
const MASTERY_LABELS = ['', '🥉', '🥈', '🥇'];

export const WorldMapScreen = () => {
  const { data } = useProgression();
  const { theme, textStyles } = useTheme();
  const currentLevel = data?.level || 1;
  const scrollViewRef = useRef<ScrollView>(null);

  const [discoveryGame, setDiscoveryGame] = useState<GameBlueprint | null>(null);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());

  // Phase G8A: Transition state
  const [transitioningGame, setTransitioningGame] = useState<GameBlueprint | null>(null);

  const allGames = getAllGames();
  const pulseAnims = useRef<Record<string, Animated.Value>>({}).current;
  const entranceOpacities = useRef<Record<string, Animated.Value>>({}).current;
  const entranceTranslates = useRef<Record<string, Animated.Value>>({}).current;
  const activeSeason = seasonalEngine.getActiveSeason();
  const unlockedLandmarks = data?.worldState?.unlockedLandmarks || [];

  allGames.forEach((g) => {
    if (!pulseAnims[g.id]) {
      pulseAnims[g.id] = new Animated.Value(1);
      entranceOpacities[g.id] = new Animated.Value(0);
      entranceTranslates[g.id] = new Animated.Value(20);
    }
  });

  useEffect(() => {
    // Preload assets for unlocked games when map opens
    preloadUnlockedGames().catch(() => {});

    // Staggered entrance
    allGames.forEach((game, index) => {
      Animated.parallel([
        Animated.timing(entranceOpacities[game.id], {
          toValue: 1,
          duration: 400,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.timing(entranceTranslates[game.id], {
          toValue: 0,
          duration: 400,
          delay: index * 80,
          useNativeDriver: true,
        }),
      ]).start();

      if (game.status.unlocked) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnims[game.id], { toValue: 1.06, duration: 1200, useNativeDriver: true }),
            Animated.timing(pulseAnims[game.id], { toValue: 1, duration: 1200, useNativeDriver: true }),
          ])
        ).start();
      }
    });
  }, []);

  const handleNodePress = (game: GameBlueprint) => {
    if (!game.status.unlocked) return;

    // First-time discovery cinematic
    if (!game.status.discovered && !discoveredIds.has(game.id)) {
      setDiscoveryGame(game);
      setDiscoveredIds((prev) => new Set([...prev, game.id]));
      return;
    }

    // Trigger smooth cinematic transition instead of abrupt navigation
    setTransitioningGame(game);
  };

  const handleDiscoveryComplete = () => {
    if (!discoveryGame) return;
    const game = discoveryGame;
    setDiscoveryGame(null);
    setTransitioningGame(game);
  };

  const handleTransitionComplete = () => {
    if (transitioningGame) {
      navigationService.goToGamePlay(transitioningGame.id);
      setTimeout(() => setTransitioningGame(null), 100);
    }
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentContainerStyle={[styles.container, { backgroundColor: '#0A0A15' }]}
    >
      {/* ─── Phase G8B: Seasonal Background Tint ─── */}
      {activeSeason.id !== 'none' && (
        <View style={[styles.seasonalTint, { backgroundColor: activeSeason.backgroundTint }]} pointerEvents="none" />
      )}
      {/* ─── Discovery Cinematic ─── */}
      {discoveryGame && (
        <DiscoveryReveal
          worldName={discoveryGame.atmosphere.primaryColor ? '' : ''}
          worldIcon={
            discoveryGame.id === 'pattern_memory' ? '🔮'
            : discoveryGame.id === 'visual_hunt' ? '🔭'
            : discoveryGame.id === 'sequence_recall' ? '🌊'
            : discoveryGame.id === 'sound_memory' ? '🎵'
            : '⚙️'
          }
          primaryColor={discoveryGame.atmosphere.primaryColor}
          glowColor={discoveryGame.atmosphere.glowColor}
          onComplete={handleDiscoveryComplete}
        />
      )}

      {/* ─── Phase G8A: Cinematic World Transition ─── */}
      <WorldTransition
        isVisible={!!transitioningGame}
        targetIdentity={transitioningGame ? getIdentity(transitioningGame.id) : null}
        onTransitionComplete={handleTransitionComplete}
      />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigationService.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        
        {/* Phase G8B: Child Identity Badge replaces old stats */}
        <ChildIdentityBadge />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pathContainer}>
          {allGames.map((game, index) => {
            const isUnlocked = game.status.unlocked;
            const mastery = game.status.masteryLevel;
            const isNew = isUnlocked && !game.status.discovered && !discoveredIds.has(game.id);
            const isLeft = index % 2 === 0;

            // Phase G8B: Find landmarks associated with this world
            const worldLandmarks = unlockedLandmarks
              .filter(id => LANDMARKS[id]?.worldId === game.id)
              .map(id => LANDMARKS[id]);

            return (
              <Animated.View
                key={game.id}
                style={[
                  styles.nodeWrapper,
                  { alignSelf: isLeft ? 'flex-start' : 'flex-end', opacity: entranceOpacities[game.id], transform: [{ translateY: entranceTranslates[game.id] }] }
                ]}
              >
                <TouchableOpacity
                  activeOpacity={isUnlocked ? 0.8 : 1}
                  onPress={() => handleNodePress(game)}
                >
                  <Animated.View
                    style={[
                      styles.nodeOuter,
                      {
                        borderColor: isUnlocked ? game.atmosphere.primaryColor : 'rgba(255,255,255,0.1)',
                        shadowColor: isUnlocked ? game.atmosphere.primaryColor : 'transparent',
                        transform: [{ scale: isUnlocked ? pulseAnims[game.id] : new Animated.Value(1) }],
                      },
                    ]}
                  >
                    {/* Atmosphere preview fill */}
                    <View
                      style={[
                        styles.nodeInner,
                        {
                          backgroundColor: isUnlocked
                            ? game.atmosphere.primaryColor
                            : '#1E293B',
                        },
                      ]}
                    >
                      <Text style={styles.nodeIcon}>
                        {isUnlocked
                          ? (game.id === 'memory' ? '🗺️'
                            : game.id === 'attention' ? '🛡️'
                            : game.id === 'reaction' ? '⚡'
                            : game.id === 'pattern_memory' ? '🔮'
                            : game.id === 'visual_hunt' ? '🔭'
                            : game.id === 'sequence_recall' ? '🌊'
                            : game.id === 'sound_memory' ? '🎵'
                            : '⚙️')
                          : '🔒'}
                      </Text>
                    </View>

                    {/* Mastery badge */}
                    {mastery > 0 && (
                      <View style={[styles.masteryBadge, { backgroundColor: MASTERY_COLORS[mastery] }]}>
                        <Text style={styles.masteryLabel}>{MASTERY_LABELS[mastery]}</Text>
                      </View>
                    )}

                    {/* "NEW" beacon */}
                    {isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>YENİ</Text>
                      </View>
                    )}
                  </Animated.View>
                </TouchableOpacity>

                {/* Phase G8B: Render Landmarks around the node */}
                {worldLandmarks.map((lm, idx) => (
                  <View 
                    key={lm.id} 
                    style={[
                      styles.landmarkIcon, 
                      isLeft ? { right: -15, top: 20 * idx } : { left: -15, top: 20 * idx }
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{lm.icon}</Text>
                  </View>
                ))}

                {/* World info below node */}
                <View style={styles.nodeInfo}>
                  <Text
                    style={[
                      styles.nodeTitle,
                      { color: isUnlocked ? theme.colors.text : 'rgba(255,255,255,0.3)' },
                    ]}
                    numberOfLines={1}
                  >
                    {game.id === 'memory' ? 'Hazine Haritası'
                      : game.id === 'attention' ? 'Dikkat Görevi'
                      : game.id === 'reaction' ? 'Hız Testi'
                      : game.id === 'pattern_memory' ? 'Kristal Tapınak'
                      : game.id === 'visual_hunt' ? 'Kaşif Gözü'
                      : game.id === 'sequence_recall' ? 'Yankı Yolu'
                      : game.id === 'sound_memory' ? 'Melodi Ormanı'
                      : 'Zihin Dövmeci'}
                  </Text>
                  {!isUnlocked && (
                    <Text style={styles.lockedHint}>Kilitli</Text>
                  )}
                  {isUnlocked && (
                    <Text style={[styles.cognitiveTag, { color: game.atmosphere.primaryColor }]}>
                      {game.cognitiveDomains[0].replace(/_/g, ' ')}
                    </Text>
                  )}
                </View>

                {/* Connector line to next node */}
                {index < allGames.length - 1 && (
                  <View style={[styles.connector, isLeft ? styles.connectorRight : styles.connectorLeft]} />
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* ─── Future World Hooks (placeholder) ─── */}
        {/* SEASONAL_WORLDS, EVENT_WORLDS, LIMITED_TIME_WORLDS rendered here in the future */}
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>✨ Yakında daha fazla dünya...</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  seasonalTint: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 10,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  mapTitle: {
    fontSize: 18, fontWeight: '900', letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full,
  },
  statText: {
    color: '#FBBF24', fontWeight: '800', fontSize: 14,
  },
  levelBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full,
  },
  levelText: {
    color: 'white', fontWeight: '900', fontSize: 13,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: 120,
    paddingHorizontal: spacing.xl,
  },
  pathContainer: {
    width: '100%',
  },
  nodeWrapper: {
    marginBottom: 56,
    width: '58%',
    alignItems: 'center',
  },
  nodeOuter: {
    width: 86, height: 86, borderRadius: 43,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
    position: 'relative',
  },
  nodeInner: {
    width: '100%', height: '100%', borderRadius: 43,
    justifyContent: 'center', alignItems: 'center',
  },
  nodeIcon: {
    fontSize: 32,
  },
  masteryBadge: {
    position: 'absolute', top: -6, right: -6,
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0A0A15',
  },
  masteryLabel: { fontSize: 13 },
  newBadge: {
    position: 'absolute', bottom: -6, left: '50%', marginLeft: -18,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 1,
  },
  landmarkIcon: {
    position: 'absolute',
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  nodeInfo: {
    marginTop: spacing.sm, alignItems: 'center', gap: 2,
  },
  nodeTitle: {
    fontSize: 14, fontWeight: '800', textAlign: 'center',
  },
  lockedHint: {
    color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: '600',
  },
  cognitiveTag: {
    fontSize: 11, fontWeight: '700', textTransform: 'capitalize',
    opacity: 0.8,
  },
  connector: {
    position: 'absolute',
    bottom: -40, width: 2, height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  connectorRight: { right: -10 },
  connectorLeft: { left: -10 },
  comingSoon: {
    alignItems: 'center', marginTop: 16, paddingBottom: 20,
  },
  comingSoonText: {
    color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: '600',
  },
});
