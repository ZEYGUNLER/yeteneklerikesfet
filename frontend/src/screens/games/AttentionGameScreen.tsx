import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, ActivityIndicator } from 'react-native';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameMetrics } from '@/hooks/useGameMetrics';
import { useAdaptiveEngine } from '@/hooks/useAdaptiveEngine';
import { useGameplayReady } from '@/hooks/useGameplayReady';
import { GameLayout } from '@/components/games/GameLayout';
import { GameButton } from '@/components/games/GameActionCard';
import { InteractionOnboarding } from '@/components/common/InteractionOnboarding';
import { navigationService } from '@/navigation/navigation.service';

// ─── Level Config ─────────────────────────────────────────────────────────────
type LevelKey = 1 | 2 | 3;
const LEVEL_CONFIG: Record<LevelKey, {
  name: string;
  targets: string[];
  distractors: string[];
  baseDuration: number;
  minDuration: number;
  waitRatio: number; // Go ratio is (1 - waitRatio). E.g., for 85% Go, waitRatio is 0.15.
  celebrationTitle: string;
  celebrationSubtitle: string;
  hint: string;
}> = {
  1: {
    name: '🌱 Çayır',
    targets: ['🐰'],
    distractors: ['🦊'],
    baseDuration: 2000,
    minDuration: 1200,
    waitRatio: 0.15, // 85% Go / 15% No-Go
    celebrationTitle: 'Çayırı Aştın!',
    celebrationSubtitle: 'Harikaydın! Orman seni bekliyor...',
    hint: 'Tavşanı gördüğünde dokun!',
  },
  2: {
    name: '🌲 Orman',
    targets: ['🐰', '🐿️'],
    distractors: ['🦊'],
    baseDuration: 1800,
    minDuration: 1000,
    waitRatio: 0.20, // 80% Go / 20% No-Go
    celebrationTitle: 'Ormanı Geçtin!',
    celebrationSubtitle: 'Dikkat gücün artıyor! Kale seni bekliyor...',
    hint: 'Tavşan veya sincap görünce dokun!',
  },
  3: {
    name: '🏰 Kale',
    targets: ['🐰', '🐿️'],
    distractors: ['🦊', '🐺'],
    baseDuration: 1500,
    minDuration: 850,
    waitRatio: 0.25, // 75% Go / 25% No-Go
    celebrationTitle: '',
    celebrationSubtitle: '',
    hint: 'Dikkatini topla! Yeni tehlikeler var...',
  },
};

const TOTAL_ROUNDS = 8;
const ISI_DURATION = 700;

const HIT_MESSAGES = ['✨ Harika!', '🌟 Aferin!', '🎯 Gördün!', '💫 Tam İsabet!'];
const REJECTION_MESSAGES = ['💙 Dikkatlisin!', '🛡️ Çok İyi!', '👀 Gözlerin Keskin!'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type FSMState = 'starting' | 'prepare_round' | 'stimulus_active' | 'feedback' | 'world_intro' | 'summary';

// ─── Component ────────────────────────────────────────────────────────────────
export function AttentionGameScreen() {
  const { status, error, finishGame } = useGameSession({ gameId: 'attention' });
  const { recordInteraction, getFinalMetrics } = useGameMetrics();
  const { recordAdaptiveEvent, getAdaptiveInsights } = useAdaptiveEngine();
  const { isReady, showOnboarding, dismissOnboarding } = useGameplayReady(status);

  // ── Progression & States ─────────────────────────────────────────────────────
  const [level, setLevel] = useState<LevelKey>(1);
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState<FSMState>('starting');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<any>(null);

  // ── Turn state ───────────────────────────────────────────────────────────────
  const [currentChar, setCurrentChar] = useState<{ char: string; isTarget: boolean } | null>(null);
  const [showChar, setShowChar] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const [turnFeedback, setTurnFeedback] = useState<string | null>(null);

  // ── Adaptive & Pacing State ──────────────────────────────────────────────────
  const [adaptiveDuration, setAdaptiveDuration] = useState<number>(2000);
  const adaptiveDurationRef = useRef<number>(2000);

  useEffect(() => {
    adaptiveDurationRef.current = adaptiveDuration;
  }, [adaptiveDuration]);

  // ── Analytics Refs ───────────────────────────────────────────────────────────
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const falseAlarmsRef = useRef(0);
  const correctRejectionsRef = useRef(0);
  const currentStreakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const reactionTimesRef = useRef<number[]>([]);
  const turnStartRef = useRef<number>(Date.now());

  // ── Attention Recovery Rate Tracking ─────────────────────────────────────────
  const consecutiveCorrectHitsRef = useRef(0);
  const recoveryTrialsLeftRef = useRef(0);
  const totalRecoveryTrackingPeriodsRef = useRef(0);
  const totalRecoveryHitsRef = useRef(0);

  // ── Stale-closure-safe refs ───────────────────────────────────────────────────
  const levelRef = useRef<LevelKey>(1);
  const roundRef = useRef(1);
  const currentCharRef = useRef<{ char: string; isTarget: boolean } | null>(null);
  const inputLockedRef = useRef(false);

  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { roundRef.current = round; }, [round]);

  // ── Timer Registry Helper ────────────────────────────────────────────────────
  const timerRegistry = useRef<Set<NodeJS.Timeout>>(new Set());

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timerRegistry.current.delete(timer);
      callback();
    }, delay);
    timerRegistry.current.add(timer);
    return timer;
  }, []);

  const clearAllTimers = useCallback(() => {
    timerRegistry.current.forEach(clearTimeout);
    timerRegistry.current.clear();
  }, []);

  // ── Animation values ─────────────────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(1)).current;
  const charOpacity = useRef(new Animated.Value(0)).current;
  const charScale = useRef(new Animated.Value(0.85)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // ── Show brief feedback ──────────────────────────────────────────────────────
  const showBriefFeedback = useCallback((text: string) => {
    setTurnFeedback(text);
    feedbackOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setTurnFeedback(null));
  }, [feedbackOpacity]);

  // ── Process a turn result ────────────────────────────────────────────────────
  const processResult = useCallback((pressed: boolean, char: { char: string; isTarget: boolean }) => {
    const reactionTime = Date.now() - turnStartRef.current;
    let isCorrect = false;

    // Track attention recovery in the trials following a mistake
    if (recoveryTrialsLeftRef.current > 0) {
      recoveryTrialsLeftRef.current--;
      const currentTrialCorrect = (pressed && char.isTarget) || (!pressed && !char.isTarget);
      if (currentTrialCorrect) {
        totalRecoveryHitsRef.current++;
      }
    }

    if (pressed && char.isTarget) {
      isCorrect = true;
      hitsRef.current++;
      currentStreakRef.current++;
      bestStreakRef.current = Math.max(bestStreakRef.current, currentStreakRef.current);
      reactionTimesRef.current.push(reactionTime);
      recordInteraction(true);
      recordAdaptiveEvent(true, reactionTime);
      showBriefFeedback(randomFrom(HIT_MESSAGES));

      // Adaptive Accelerate: Every 2 consecutive hits reduce displayDuration by 100ms
      consecutiveCorrectHitsRef.current++;
      if (consecutiveCorrectHitsRef.current >= 2) {
        consecutiveCorrectHitsRef.current = 0;
        const limit = LEVEL_CONFIG[levelRef.current].minDuration;
        setAdaptiveDuration(prev => Math.max(limit, prev - 100));
      }
    } else if (!pressed && !char.isTarget) {
      isCorrect = true;
      correctRejectionsRef.current++;
      currentStreakRef.current++;
      bestStreakRef.current = Math.max(bestStreakRef.current, currentStreakRef.current);
      recordInteraction(true);
      recordAdaptiveEvent(true, reactionTime);
      showBriefFeedback(randomFrom(REJECTION_MESSAGES));
      consecutiveCorrectHitsRef.current = 0;
    } else if (pressed && !char.isTarget) {
      // Commission Error
      falseAlarmsRef.current++;
      currentStreakRef.current = 0;
      recordInteraction(false);
      recordAdaptiveEvent(false, reactionTime);
      showBriefFeedback('🤔 Dur bir dakika!');
      consecutiveCorrectHitsRef.current = 0;

      // Adaptive Decelerate: False alarm increases display duration by 150ms
      const baseLimit = LEVEL_CONFIG[levelRef.current].baseDuration;
      setAdaptiveDuration(prev => Math.min(baseLimit, prev + 150));
    } else {
      // Omission Error
      missesRef.current++;
      currentStreakRef.current = 0;
      recordInteraction(false);
      recordAdaptiveEvent(false, reactionTime);
      consecutiveCorrectHitsRef.current = 0;
    }

    // Trigger Recovery Period of 3 trials if this trial was a mistake
    if (!isCorrect && recoveryTrialsLeftRef.current === 0) {
      recoveryTrialsLeftRef.current = 3;
      totalRecoveryTrackingPeriodsRef.current++;
    }
  }, [recordInteraction, recordAdaptiveEvent, showBriefFeedback]);

  // ── Save session in background ──────────────────────────────────────────────
  const handleFinishGame = async () => {
    setIsSaving(true);
    const final = getFinalMetrics();
    const tgt = hitsRef.current + missesRef.current;
    const dis = falseAlarmsRef.current + correctRejectionsRef.current;
    const attentionScore = tgt > 0 ? Math.round((hitsRef.current / tgt) * 100) : 0;
    const inhibitionScore = dis > 0 ? Math.round((correctRejectionsRef.current / dis) * 100) : 0;
    const avgRT = reactionTimesRef.current.length > 0
      ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
      : 0;
    const combined = (attentionScore + inhibitionScore) / 2;
    const starsEarned = combined >= 90 ? 3 : combined >= 70 ? 2 : combined >= 50 ? 1 : 0;

    const recoveryRate = totalRecoveryTrackingPeriodsRef.current > 0
      ? Math.round((totalRecoveryHitsRef.current / (totalRecoveryTrackingPeriodsRef.current * 3)) * 100)
      : 100;

    try {
      const summaryPayload = await finishGame({
        score: final.score,
        accuracy: final.accuracy,
        metadata: {
          ...final.metadata,
          hits: hitsRef.current,
          misses: missesRef.current,
          falseAlarms: falseAlarmsRef.current,
          correctRejections: correctRejectionsRef.current,
          attentionScore,
          inhibitionScore,
          impulsivityScore: 100 - inhibitionScore,
          avgReactionTime: avgRT,
          bestStreak: bestStreakRef.current,
          starsEarned,
          attentionRecoveryRate: recoveryRate,
          gameType: 'attention',
          adaptive: getAdaptiveInsights(),
        },
      }, true); // skipNavigation = true

      setSaveResult(summaryPayload);
    } catch (e) {
      console.error('[AttentionGameScreen] Error saving game session:', e);
    } finally {
      setIsSaving(false);
      setGameState('summary');
    }
  };

  // ── Advance to next round or level ──────────────────────────────────────────
  const advanceRound = useCallback(() => {
    const lvl = levelRef.current;
    const rnd = roundRef.current;

    if (rnd >= TOTAL_ROUNDS) {
      if (lvl < 3) {
        setGameState('world_intro');
        safeSetTimeout(() => {
          const next = (lvl + 1) as LevelKey;
          levelRef.current = next;
          roundRef.current = 1;
          setLevel(next);
          setRound(1);
          setGameState('prepare_round');
          // Reset adaptive duration to base duration of new world
          setAdaptiveDuration(LEVEL_CONFIG[next].baseDuration);
        }, 3200);
      } else {
        void handleFinishGame();
      }
    } else {
      roundRef.current = rnd + 1;
      setRound(rnd + 1);
      setGameState('prepare_round');
    }
  }, [finishGame, safeSetTimeout]);

  // ── Start a new turn ─────────────────────────────────────────────────────────
  const startTurn = useCallback(() => {
    clearAllTimers();

    const config = LEVEL_CONFIG[levelRef.current];
    const isTarget = Math.random() > config.waitRatio;
    const pool = isTarget ? config.targets : config.distractors;
    const char = randomFrom(pool);
    const charData = { char, isTarget };

    currentCharRef.current = charData;
    inputLockedRef.current = true;
    setCurrentChar(charData);
    setShowChar(false);
    setInputLocked(true);

    // ISI: show blank screen first, then reveal character
    safeSetTimeout(() => {
      inputLockedRef.current = false;
      setShowChar(true);
      setInputLocked(false);
      setGameState('stimulus_active');
      turnStartRef.current = Date.now();

      // Gentle character entrance after ISI
      charOpacity.setValue(0);
      charScale.setValue(0.85);
      Animated.parallel([
        Animated.timing(charOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(charScale, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();

      // Smooth timer bar
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: adaptiveDurationRef.current,
        useNativeDriver: false,
      }).start();

      // Auto-timeout after adaptive duration
      safeSetTimeout(() => {
        if (inputLockedRef.current) return;
        inputLockedRef.current = true;
        setInputLocked(true);
        setGameState('feedback');
        const snapshot = currentCharRef.current;
        if (snapshot) processResult(false, snapshot);
        safeSetTimeout(() => advanceRound(), 400);
      }, adaptiveDurationRef.current);
    }, ISI_DURATION);
  }, [charOpacity, charScale, progressAnim, processResult, advanceRound, clearAllTimers, safeSetTimeout]);

  // ── Trigger new turn when gameState matches prepare_round ────────────────────
  useEffect(() => {
    if (!isReady || gameState !== 'prepare_round') return;
    startTurn();
  }, [isReady, gameState, startTurn]);

  // ── Handle onboarding completed gate ─────────────────────────────────────────
  useEffect(() => {
    if (isReady && gameState === 'starting') {
      setGameState('prepare_round');
      setAdaptiveDuration(LEVEL_CONFIG[level].baseDuration);
    }
  }, [isReady, gameState, level]);

  // ── Handle user tap ──────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (!isReady || inputLockedRef.current || !currentCharRef.current || !showChar) return;
    clearAllTimers();
    progressAnim.stopAnimation();
    inputLockedRef.current = true;
    setInputLocked(true);
    setGameState('feedback');
    processResult(true, currentCharRef.current);
    safeSetTimeout(() => advanceRound(), 400);
  }, [isReady, showChar, progressAnim, processResult, advanceRound, clearAllTimers, safeSetTimeout]);

  // ── Error state ──────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <GameLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Bir sorun oluştu</Text>
          <Text style={styles.errorText}>{error || 'Oyun başlatılamadı.'}</Text>
          <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
            onPress={() => navigationService.goToGames()}>
            <Text style={styles.retryBtnText}>Oyunlara Dön</Text>
          </Pressable>
        </View>
      </GameLayout>
    );
  }

  const config = LEVEL_CONFIG[level];
  const timerBarWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (isSaving) {
    return (
      <GameLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Dikkat gücü hesaplanıyor...</Text>
          <Text style={styles.loadingSubtext}>Gözcü Karnesi hazırlanıyor...</Text>
        </View>
      </GameLayout>
    );
  }

  if (gameState === 'summary') {
    const finalStats = getFinalMetrics();
    const tgt = hitsRef.current + missesRef.current;
    const dis = falseAlarmsRef.current + correctRejectionsRef.current;
    const attentionScore = tgt > 0 ? Math.round((hitsRef.current / tgt) * 100) : 0;
    const inhibitionScore = dis > 0 ? Math.round((correctRejectionsRef.current / dis) * 100) : 0;
    const avgRT = reactionTimesRef.current.length > 0
      ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
      : 0;
    const recoveryRate = totalRecoveryTrackingPeriodsRef.current > 0
      ? Math.round((totalRecoveryHitsRef.current / (totalRecoveryTrackingPeriodsRef.current * 3)) * 100)
      : 100;
    const combined = (attentionScore + inhibitionScore) / 2;
    const stars = combined >= 90 ? 3 : combined >= 70 ? 2 : combined >= 50 ? 1 : 0;

    return (
      <GameLayout>
        <View style={styles.cardContainer}>
          <Text style={styles.cardHeader}>🌲 Gözcü Karnesi 🌲</Text>
          <Text style={styles.cardTitle}>Orman Koruyucusu</Text>

          <View style={styles.starsContainer}>
            <Text style={styles.starsText}>
              {stars >= 1 ? '⭐' : '☆'} {stars >= 2 ? '⭐' : '☆'} {stars >= 3 ? '⭐' : '☆'}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statLabel}>Dikkat Gücü</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>%{attentionScore}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🛡️</Text>
              <Text style={styles.statLabel}>Dürtü Kontrolü</Text>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>%{inhibitionScore}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🔄</Text>
              <Text style={styles.statLabel}>Dikkat Toparlama</Text>
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>%{recoveryRate}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⚡</Text>
              <Text style={styles.statLabel}>Tepki Hızı</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{avgRT}ms</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <GameButton
              title="Maceraya Devam Et"
              variant="primary"
              onPress={() => {
                if (saveResult) {
                  navigationService.goToGameSummary(saveResult);
                } else {
                  navigationService.goToGameSummary({
                    score: finalStats.score,
                    duration: 0,
                    accuracy: finalStats.accuracy,
                    totalCorrect: hitsRef.current,
                    gameType: 'attention',
                  });
                }
              }}
            />
          </View>
        </View>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      {showOnboarding && (
        <InteractionOnboarding
          type="hold"
          message="Dokunarak Oyna"
          onComplete={dismissOnboarding}
        />
      )}

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.worldName}>{config.name}</Text>
        <Text style={styles.roundCounter}>Tur {Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</Text>
      </View>

      {/* ── Hint bar ── */}
      <View style={styles.hintBar}>
        <Text style={styles.hintText}>{config.hint}</Text>
      </View>

      {/* ── Timer Bar ── */}
      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerFill, { width: timerBarWidth }]} />
      </View>

      {/* ── Level Transition ── */}
      {gameState === 'world_intro' ? (
        <View style={styles.transitionContainer}>
          <Text style={styles.transitionEmoji}>🌟</Text>
          <Text style={styles.transitionTitle}>{config.celebrationTitle}</Text>
          <Text style={styles.transitionSubtitle}>{config.celebrationSubtitle}</Text>
          <View style={styles.transitionStars}>
            <Text style={styles.transitionStarText}>✨ ✨ ✨</Text>
          </View>
        </View>
      ) : (
        /* ── Character Display ── */
        <View style={styles.characterArea}>
          {showChar ? (
            <Animated.Text
              style={[
                styles.characterEmoji,
                { opacity: charOpacity, transform: [{ scale: charScale }] },
              ]}
            >
              {currentChar?.char ?? ''}
            </Animated.Text>
          ) : (
            <Text style={styles.isiPlaceholder}>👀</Text>
          )}

          {/* Feedback overlay */}
          {turnFeedback && (
            <Animated.Text style={[styles.feedbackText, { opacity: feedbackOpacity }]}>
              {turnFeedback}
            </Animated.Text>
          )}
        </View>
      )}

      {/* ── Target reminder ── */}
      {gameState !== 'world_intro' && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>{config.targets.join(' ')}</Text>
            <Text style={styles.legendLabel}>Dokun</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>{config.distractors.join(' ')}</Text>
            <Text style={styles.legendLabel}>Dokunma</Text>
          </View>
        </View>
      )}

      {/* ── Tap Button ── */}
      {gameState !== 'world_intro' && (
        <View style={styles.controls}>
          <Pressable
            onPress={handleTap}
            disabled={inputLocked || !isReady || gameState !== 'stimulus_active'}
            style={({ pressed }) => [
              styles.tapButton,
              (inputLocked || !isReady || gameState !== 'stimulus_active') && styles.tapButtonDisabled,
              pressed && styles.tapButtonPressed,
            ]}
          >
            <Text style={styles.tapButtonText}>Dokun!</Text>
          </Pressable>
          <Pressable
            onPress={() => navigationService.goToGames()}
            style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.exitBtnText}>Oyunlara Dön</Text>
          </Pressable>
        </View>
      )}
    </GameLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  worldName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  roundCounter: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  hintBar: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
  },
  timerTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  timerFill: {
    height: '100%',
    backgroundColor: '#7DD3FC',
    borderRadius: 3,
  },
  characterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  characterEmoji: {
    fontSize: 96,
  },
  isiPlaceholder: {
    fontSize: 48,
    color: '#CBD5E1',
  },
  feedbackText: {
    position: 'absolute',
    bottom: 0,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 12,
    marginBottom: 8,
  },
  legendItem: {
    alignItems: 'center',
    gap: 4,
  },
  legendEmoji: {
    fontSize: 28,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legendDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  controls: {
    gap: 10,
    paddingBottom: 8,
  },
  tapButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  tapButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  tapButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: '#2563EB',
  },
  tapButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1,
  },
  exitBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  exitBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  transitionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 250,
  },
  transitionEmoji: {
    fontSize: 72,
  },
  transitionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  transitionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  transitionStars: {
    marginTop: 8,
  },
  transitionStarText: {
    fontSize: 32,
    letterSpacing: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorEmoji: { fontSize: 56 },
  errorTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#64748B', textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  // ─── Gözcü Karnesi & Yükleme Stilleri ────────────────────────────────────────
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginVertical: 16,
  },
  cardHeader: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B82F6',
    marginTop: 4,
  },
  starsContainer: {
    marginVertical: 16,
  },
  starsText: {
    fontSize: 36,
    letterSpacing: 12,
  },
  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginVertical: 16,
  },
  statCard: {
    width: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  statEmoji: {
    fontSize: 28,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardFooter: {
    width: '100%',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
});
