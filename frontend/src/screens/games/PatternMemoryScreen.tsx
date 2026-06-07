import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform, Dimensions, Pressable, ActivityIndicator
} from 'react-native';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameMetrics } from '@/hooks/useGameMetrics';
import { useGameFeedback } from '@/hooks/useGameFeedback';
import { useAdaptiveEngine } from '@/hooks/useAdaptiveEngine';
import { useGameplayReady } from '@/hooks/useGameplayReady';
import { GameLayout } from '@/components/games/GameLayout';
import { GameHeader } from '@/components/games/GameHeader';
import { GameButton } from '@/components/games/GameActionCard';
import { navigationService } from '@/navigation/navigation.service';
import { interactionEngine } from '@/services/interactionEngine';
import { InteractionOnboarding } from '@/components/common/InteractionOnboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ──────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 24;
const BASE_SHOW_DURATION = 800;  // ms each symbol shown
const BASE_PATTERN_LENGTH = 3;   // starts with 3 symbols

type LayoutType = 'grid_3x3' | 'grid_4x4' | 'irregular_cluster';
type FSMState =
  | 'starting'
  | 'world_intro'
  | 'prepare_round'
  | 'showing'
  | 'recall'
  | 'result_delay'
  | 'summary';

// ─── Coordinate Layouts ──────────────────────────────────────────────────────
const POSITIONS_3X3 = [
  { top: '18%', left: '18%' }, { top: '18%', left: '50%' }, { top: '18%', left: '82%' },
  { top: '50%', left: '18%' }, { top: '50%', left: '50%' }, { top: '50%', left: '82%' },
  { top: '82%', left: '18%' }, { top: '82%', left: '50%' }, { top: '82%', left: '82%' }
];

const POSITIONS_4X4 = [
  { top: '12%', left: '12%' }, { top: '12%', left: '37%' }, { top: '12%', left: '63%' }, { top: '12%', left: '88%' },
  { top: '37%', left: '12%' }, { top: '37%', left: '37%' }, { top: '37%', left: '63%' }, { top: '37%', left: '88%' },
  { top: '63%', left: '12%' }, { top: '63%', left: '37%' }, { top: '63%', left: '63%' }, { top: '63%', left: '88%' },
  { top: '88%', left: '12%' }, { top: '88%', left: '37%' }, { top: '88%', left: '63%' }, { top: '88%', left: '88%' }
];

const POSITIONS_IRREGULAR = [
  { top: '14%', left: '22%' }, { top: '18%', left: '55%' }, { top: '12%', left: '82%' },
  { top: '36%', left: '15%' }, { top: '44%', left: '42%' }, { top: '38%', left: '76%' },
  { top: '58%', left: '88%' }, { top: '64%', left: '22%' }, { top: '68%', left: '58%' },
  { top: '88%', left: '16%' }, { top: '90%', left: '50%' }, { top: '84%', left: '82%' }
];

const WORLD_NAMES: Record<number, string> = {
  1: 'Gökkuşağı Mağarası',
  2: 'Fısıldayan Kanyon',
  3: 'Yıldız Obsidyeni'
};

const WORLD_THEME: Record<number, { primary: string; bg: string }> = {
  1: { primary: '#8B5CF6', bg: '#2E1065' },
  2: { primary: '#06B6D4', bg: '#082F49' },
  3: { primary: '#F59E0B', bg: '#1C0A00' }
};

// ─── Component ─────────────────────────────────────────────────────────────────
export function PatternMemoryScreen() {
  const { status, error, finishGame } = useGameSession({ gameId: 'pattern_memory' });
  const { metrics, recordInteraction, getFinalMetrics } = useGameMetrics();
  const { adaptiveParams, recordAdaptiveEvent, getAdaptiveInsights } = useAdaptiveEngine();
  const { feedback, triggerFeedback } = useGameFeedback('pattern_memory', adaptiveParams.encouragementMode);

  const { isReady, showOnboarding, dismissOnboarding } = useGameplayReady(status);

  // --- Game State ---
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<FSMState>('starting');
  const [pattern, setPattern] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [activeGlowIndex, setActiveGlowIndex] = useState<number | null>(null);
  const [roundCorrect, setRoundCorrect] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<any>(null);

  // --- Ref for timers and FSM safety ---
  const timerRegistry = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMountedRef = useRef(true);
  const inputActiveRef = useRef(false);
  const currentRoundRef = useRef(1);

  // --- Animation Value ---
  const glowAnim = useRef(new Animated.Value(0)).current;

  // --- Analytics 2.0 tracking refs ---
  const sequenceLengthHistoryRef = useRef<number[]>([]);
  const world1CorrectRef = useRef(0);
  const world2CorrectRef = useRef(0);
  const world3CorrectRef = useRef(0);

  const transpositionErrorsRef = useRef(0);
  const distanceErrorsRef = useRef<number[]>([]);
  const hesitationIntervalsRef = useRef<number[]>([]);
  const lastTapTimeRef = useRef(0);

  const currentSequenceCorrectRef = useRef(true);
  const currentSequenceWrongStepsRef = useRef(0);

  // --- World mapping based on round ---
  const world = round <= 8 ? 1 : round <= 16 ? 2 : 3;
  const currentLayout: LayoutType = world === 1 ? 'grid_3x3' : world === 2 ? 'grid_4x4' : 'irregular_cluster';
  const layoutCrystals = currentLayout === 'grid_3x3' ? POSITIONS_3X3 : currentLayout === 'grid_4x4' ? POSITIONS_4X4 : POSITIONS_IRREGULAR;

  // Dynamic Pattern Length (Adapts dynamically on 2 consecutive hits or misses)
  const [adaptiveSpan, setAdaptiveSpan] = useState(BASE_PATTERN_LENGTH);
  const consecutiveCorrectRef = useRef(0);
  const consecutiveIncorrectRef = useRef(0);

  // --- Timer Registry wrappers ---
  const safeSetTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      timerRegistry.current.delete(id);
      fn();
    }, delay);
    timerRegistry.current.add(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timerRegistry.current.forEach(clearTimeout);
    timerRegistry.current.clear();
  }, []);

  // --- Parse positions for Euclidean math ---
  const getNumericCoord = (pos: { top: string; left: string }) => {
    return {
      top: parseFloat(pos.top),
      left: parseFloat(pos.left)
    };
  };

  const getPositionCoord = (idx: number, layout: LayoutType) => {
    const list = layout === 'grid_3x3' ? POSITIONS_3X3 : layout === 'grid_4x4' ? POSITIONS_4X4 : POSITIONS_IRREGULAR;
    const pos = list[idx % list.length];
    return getNumericCoord(pos);
  };

  // --- Cleanup on unmount ---
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // --- Generate Pattern ---
  const generatePattern = useCallback((): number[] => {
    const totalCrystals = layoutCrystals.length;
    return Array.from({ length: adaptiveSpan }, () => Math.floor(Math.random() * totalCrystals));
  }, [layoutCrystals.length, adaptiveSpan]);

  // --- Flash/Show Pattern ---
  const showPattern = useCallback(async (pat: number[]) => {
    setPhase('showing');
    setActiveGlowIndex(null);
    inputActiveRef.current = false;
    const showDuration = Math.round(BASE_SHOW_DURATION / adaptiveParams.speedMultiplier);

    for (let i = 0; i < pat.length; i++) {
      if (!isMountedRef.current || currentRoundRef.current !== round) break;

      await new Promise<void>((resolve) => {
        safeSetTimeout(resolve, 250);
      });

      if (!isMountedRef.current || currentRoundRef.current !== round) break;
      const crystalIndex = pat[i];
      setActiveGlowIndex(crystalIndex);

      // Pulse ring animation
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();

      await new Promise<void>((resolve) => {
        safeSetTimeout(resolve, showDuration);
      });
      setActiveGlowIndex(null);
    }

    if (isMountedRef.current && currentRoundRef.current === round) {
      await new Promise<void>((resolve) => {
        safeSetTimeout(resolve, 300);
      });
      setPhase('recall');
      inputActiveRef.current = true;
      lastTapTimeRef.current = Date.now();
    }
  }, [glowAnim, round, adaptiveParams.speedMultiplier, safeSetTimeout]);

  // --- Start Round ---
  const startRound = useCallback(async () => {
    clearAllTimers();
    currentRoundRef.current = round;
    const pat = generatePattern();
    setPattern(pat);
    setUserInput([]);
    setRoundCorrect(null);
    currentSequenceCorrectRef.current = true;
    currentSequenceWrongStepsRef.current = 0;
    
    // Save adaptive span to history
    sequenceLengthHistoryRef.current.push(adaptiveSpan);

    await showPattern(pat);
  }, [generatePattern, showPattern, round, adaptiveSpan, clearAllTimers]);

  // G9-A.1: Onboarding check + gate start
  useEffect(() => {
    if (isReady) {
      setPhase('world_intro');
    }
  }, [isReady]);

  // --- Tap Handler ---
  const handleSymbolTap = (symbolIndex: number) => {
    if (phase !== 'recall' || !inputActiveRef.current || status !== 'playing') return;

    interactionEngine.triggerLightTap();

    const now = Date.now();
    if (userInput.length > 0) {
      const diff = now - lastTapTimeRef.current;
      hesitationIntervalsRef.current.push(diff);
    }
    lastTapTimeRef.current = now;

    const nextInput = [...userInput, symbolIndex];
    setUserInput(nextInput);

    const stepIndex = nextInput.length - 1;
    const expectedIndex = pattern[stepIndex];

    // Euclidean distance validation
    const pos1 = getPositionCoord(expectedIndex, currentLayout);
    const pos2 = getPositionCoord(symbolIndex, currentLayout);
    const dist = Math.sqrt(Math.pow(pos2.left - pos1.left, 2) + Math.pow(pos2.top - pos1.top, 2));

    if (dist > 0.1) {
      // Step was wrong
      currentSequenceCorrectRef.current = false;
      currentSequenceWrongStepsRef.current += 1;
      distanceErrorsRef.current.push(dist);

      // Transposition error: did they select adjacent step index?
      const prevExpected = pattern[stepIndex - 1];
      const nextExpected = pattern[stepIndex + 1];
      if (symbolIndex === prevExpected || symbolIndex === nextExpected) {
        transpositionErrorsRef.current += 1;
      }
    }

    // Finished sequence input
    if (nextInput.length === pattern.length) {
      inputActiveRef.current = false;
      setPhase('result_delay');

      const wasCorrect = currentSequenceCorrectRef.current;
      setRoundCorrect(wasCorrect);

      if (wasCorrect) {
        interactionEngine.triggerSuccess();
        triggerFeedback('perfect_round');
        consecutiveCorrectRef.current += 1;
        consecutiveIncorrectRef.current = 0;

        // Scale difficulty up
        if (consecutiveCorrectRef.current >= 2) {
          setAdaptiveSpan((prev) => Math.min(prev + 1, 8));
          consecutiveCorrectRef.current = 0;
        }

        // Increment correct count by world
        if (world === 1) world1CorrectRef.current += 1;
        else if (world === 2) world2CorrectRef.current += 1;
        else world3CorrectRef.current += 1;

        recordInteraction(true, adaptiveSpan);
        recordAdaptiveEvent(true, 400);
      } else {
        interactionEngine.triggerError();
        triggerFeedback('incorrect');
        consecutiveIncorrectRef.current += 1;
        consecutiveCorrectRef.current = 0;

        // Scale difficulty down
        if (consecutiveIncorrectRef.current >= 2) {
          setAdaptiveSpan((prev) => Math.max(prev - 1, 3));
          consecutiveIncorrectRef.current = 0;
        }

        recordInteraction(false, adaptiveSpan);
        recordAdaptiveEvent(false, 600);
      }

      safeSetTimeout(() => nextRound(wasCorrect), 1400);
    }
  };

  const nextRound = (wasCorrect: boolean) => {
    if (round >= TOTAL_ROUNDS) {
      void handleFinish();
      return;
    }

    const nextR = round + 1;
    setRound(nextR);

    // If entering a new world, trigger intro
    if (nextR === 9 || nextR === 17) {
      setPhase('world_intro');
    } else {
      setPhase('prepare_round');
      safeSetTimeout(startRound, 300);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    const final = getFinalMetrics();

    const avgDist = distanceErrorsRef.current.length > 0 
      ? distanceErrorsRef.current.reduce((a, b) => a + b, 0) / distanceErrorsRef.current.length 
      : 0;
    const maxDist = distanceErrorsRef.current.length > 0 
      ? Math.max(...distanceErrorsRef.current) 
      : 0;

    const avgHes = hesitationIntervalsRef.current.length > 0 
      ? hesitationIntervalsRef.current.reduce((a, b) => a + b, 0) / hesitationIntervalsRef.current.length 
      : 0;
    const maxHes = hesitationIntervalsRef.current.length > 0 
      ? Math.max(...hesitationIntervalsRef.current) 
      : 0;

    const hesVar = hesitationIntervalsRef.current.length > 0
      ? hesitationIntervalsRef.current.reduce((sq, n) => sq + Math.pow(n - avgHes, 2), 0) / hesitationIntervalsRef.current.length
      : 0;

    const w1Acc = world1CorrectRef.current / 8;
    const w2Acc = world2CorrectRef.current / 8;
    const w3Acc = world3CorrectRef.current / 8;

    // Consistency score (0-100)
    const consistencyScore = Math.max(0, 100 - Math.round(Math.sqrt(hesVar) / 10));

    // Watcher titles
    let watcherTitle = '🔮 Kristal Kaşifi';
    if (transpositionErrorsRef.current === 0 && avgDist === 0) {
      watcherTitle = '🌟 Parlayan Muhafız';
    } else if (avgHes > 1500) {
      watcherTitle = '🔷 Safir Gözcü';
    }

    const memoryLevel = final.accuracy >= 0.85 ? 'Usta' : (final.accuracy >= 0.60 ? 'Parlayan' : 'Küçük');
    const patienceLevel = avgHes > 1200 ? 'Usta' : (avgHes > 800 ? 'Parlayan' : 'Küçük');
    const focusLevel = transpositionErrorsRef.current <= 1 ? 'Usta' : (transpositionErrorsRef.current <= 3 ? 'Parlayan' : 'Küçük');

    try {
      const summaryPayload = await finishGame({
        score: final.score,
        accuracy: final.accuracy,
        metadata: {
          ...final.metadata,
          maxSpanReached: Math.max(...sequenceLengthHistoryRef.current, 3),
          correctSequences: metrics.correct,
          incorrectSequences: metrics.mistakes,
          partialSuccessRatio: metrics.correct / TOTAL_ROUNDS,
          retrievalAccuracy: final.accuracy,
          sequenceLengthHistory: sequenceLengthHistoryRef.current,
          avgSpatialDistanceError: parseFloat(avgDist.toFixed(2)),
          maxSpatialDistanceError: parseFloat(maxDist.toFixed(2)),
          avgHesitationInterval: Math.round(avgHes),
          maxHesitationInterval: Math.round(maxHes),
          hesitationVariance: Math.round(hesVar),
          worldAccuracy: {
            world1: parseFloat(w1Acc.toFixed(2)),
            world2: parseFloat(w2Acc.toFixed(2)),
            world3: parseFloat(w3Acc.toFixed(2)),
          },
          fatigueSlope: 0,
          consistencyScore,
          watcherTitle,
          crystals: {
            memory: memoryLevel,
            patience: patienceLevel,
            focus: focusLevel,
          },
          adaptive: getAdaptiveInsights(),
        }
      }, true); // skipNavigation = true

      setSaveResult(summaryPayload);
    } catch (e) {
      console.error('[PatternMemoryScreen] Error finishing game:', e);
    } finally {
      setIsSaving(false);
      setPhase('summary');
    }
  };

  const stats = [
    { label: 'Tur', value: `${round}/${TOTAL_ROUNDS}` },
    { label: 'Uzunluk', value: adaptiveSpan },
    { label: 'Skor', value: metrics.score },
  ];

  const statusText =
    phase === 'showing' ? 'Işık patikasını izle...' :
    phase === 'recall' ? (feedback?.text || 'Sırayla kristallere dokun!') :
    phase === 'world_intro' ? 'Dünya Keşfediliyor...' :
    roundCorrect ? '✨ Harika!' : '❌ Tekrar dene!';

  if (isSaving) {
    return (
      <GameLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Kristaller inceleniyor...</Text>
          <Text style={styles.loadingSubtext}>Gözcü Karnesi hazırlanıyor...</Text>
        </View>
      </GameLayout>
    );
  }

  if (phase === 'summary') {
    const final = getFinalMetrics();
    const avgDist = distanceErrorsRef.current.length > 0
      ? distanceErrorsRef.current.reduce((a, b) => a + b, 0) / distanceErrorsRef.current.length
      : 0;
    const avgHes = hesitationIntervalsRef.current.length > 0
      ? hesitationIntervalsRef.current.reduce((a, b) => a + b, 0) / hesitationIntervalsRef.current.length
      : 0;

    // Watcher titles
    let watcherTitle = '🔮 Kristal Kaşifi';
    if (transpositionErrorsRef.current === 0 && avgDist === 0) {
      watcherTitle = '🌟 Parlayan Muhafız';
    } else if (avgHes > 1500) {
      watcherTitle = '🔷 Safir Gözcü';
    }

    const memoryLevel = final.accuracy >= 0.85 ? 'Usta' : (final.accuracy >= 0.60 ? 'Parlayan' : 'Küçük');
    const patienceLevel = avgHes > 1200 ? 'Usta' : (avgHes > 800 ? 'Parlayan' : 'Küçük');
    const focusLevel = transpositionErrorsRef.current <= 1 ? 'Usta' : (transpositionErrorsRef.current <= 3 ? 'Parlayan' : 'Küçük');

    return (
      <GameLayout>
        <View style={styles.cardContainer}>
          <Text style={styles.cardHeader}>🔮 Gözcü Karnesi 🔮</Text>
          <Text style={styles.cardTitle}>{watcherTitle}</Text>

          {/* Crystals Grid */}
          <View style={styles.crystalsGrid}>
            <View style={styles.crystalCard}>
              <Text style={styles.summaryCrystalEmoji}>🧠</Text>
              <Text style={styles.crystalLabel}>Hafıza Gücü</Text>
              <Text style={[styles.crystalValue, { color: '#22C55E' }]}>
                {memoryLevel} Kristal
              </Text>
            </View>

            <View style={styles.crystalCard}>
              <Text style={styles.summaryCrystalEmoji}>⏳</Text>
              <Text style={styles.crystalLabel}>Sabır Gücü</Text>
              <Text style={[styles.crystalValue, { color: '#8B5CF6' }]}>
                {patienceLevel} Kristal
              </Text>
            </View>

            <View style={styles.crystalCard}>
              <Text style={styles.summaryCrystalEmoji}>🎯</Text>
              <Text style={styles.crystalLabel}>Odaklanma Gücü</Text>
              <Text style={[styles.crystalValue, { color: '#E879F9' }]}>
                {focusLevel} Kristal
              </Text>
            </View>
          </View>

          {/* Tower energy graphic */}
          <View style={styles.towerEnergyContainer}>
            <Text style={styles.towerEnergyLabel}>🏰 Tapınak Kristali Doluluk Oranı</Text>

            <View style={styles.towerGraphicContainer}>
              <Text style={styles.largeTowerEmoji}>🏰</Text>

              <View style={styles.energyBarTrackVertical}>
                <View
                  style={[
                    styles.energyBarFillVertical,
                    {
                      height: `${Math.min(100, Math.round((metrics.correct / TOTAL_ROUNDS) * 100))}%`,
                      backgroundColor: '#8B5CF6'
                    }
                  ]}
                >
                  <Text style={styles.fillLightning}>💎</Text>
                </View>
              </View>
            </View>

            <Text style={styles.towerEnergyValue}>
              {metrics.correct} / {TOTAL_ROUNDS} Kristal Çözüldü
            </Text>
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
                    score: metrics.score,
                    duration: 0,
                    accuracy: metrics.correct / TOTAL_ROUNDS,
                    totalCorrect: metrics.correct,
                    gameType: 'pattern_memory',
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
          message="Deseni İzle & Tekrarla"
          onComplete={dismissOnboarding}
        />
      )}

      <GameHeader
        title="Kristal Tapınak"
        stats={stats}
        progress={round / TOTAL_ROUNDS}
      />

      {/* ─── Status Label ─── */}
      <Text style={[
        styles.statusText,
        phase === 'recall' && styles.statusRecall,
        roundCorrect === true && styles.statusSuccess,
        roundCorrect === false && styles.statusError,
      ]}>
        {statusText}
      </Text>

      {/* ─── Main Play Area ─── */}
      <View style={[styles.playArea, { backgroundColor: WORLD_THEME[world].bg + '40' }]}>
        
        {/* World 2 Visual Layer (Sand Wind effect) */}
        {world === 2 && (
          <View pointerEvents="none" style={styles.sandEffect} />
        )}

        {/* World 3 Visual Layer (Star field effect) */}
        {world === 3 && (
          <View pointerEvents="none" style={styles.starEffect}>
            <Text style={[styles.starIcon, { top: '20%', left: '10%' }]}>★</Text>
            <Text style={[styles.starIcon, { top: '80%', left: '30%' }]}>★</Text>
            <Text style={[styles.starIcon, { top: '40%', left: '70%' }]}>★</Text>
            <Text style={[styles.starIcon, { top: '70%', left: '80%' }]}>★</Text>
          </View>
        )}

        {/* World Intro Overlays */}
        {phase === 'world_intro' && (
          <View style={styles.worldIntroOverlay}>
            <Text style={styles.mascotEmoji}>🦊</Text>
            <Text style={styles.worldTitle}>Dünya {world}: {WORLD_NAMES[world]}</Text>
            <Text style={styles.worldDesc}>
              {world === 1 && 'Kristal Tapınağı\'na hoş geldin! Parlayan kristallerin patikasını izle ve sırayla onlara dokun.'}
              {world === 2 && 'Harika gidiyorsun! Fısıldayan Kanyon\'a ulaştık. Grid büyüdü ve hafif bir sis perdesi kapladı.'}
              {world === 3 && 'Obsidyen Kalesi! Kristaller artık düzensiz küme düzeninde dizildi. En büyük sınavın başlıyor!'}
            </Text>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.introBtn, { backgroundColor: WORLD_THEME[world].primary }]}
              onPress={() => {
                setPhase('prepare_round');
                startRound();
              }}
            >
              <Text style={styles.introBtnText}>Hazırım!</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Crystal Matrix Nodes */}
        {phase !== 'world_intro' && layoutCrystals.map((pos, index) => {
          const isGlowing = activeGlowIndex === index;
          const isSelected = userInput.includes(index);

          return (
            <TouchableOpacity
              key={index}
              disabled={phase !== 'recall'}
              onPress={() => handleSymbolTap(index)}
              activeOpacity={0.7}
              style={[
                styles.crystalNode,
                { top: pos.top as any, left: pos.left as any },
                isSelected && styles.crystalNodeSelected,
                isGlowing && styles.crystalNodeGlowing,
              ]}
            >
              {(isGlowing || isSelected) && (
                <Animated.View 
                  style={[
                    styles.glowRing, 
                    { 
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 0.9]
                      }) 
                    }
                  ]} 
                />
              )}
              <Text style={styles.crystalEmoji}>💎</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── User input preview ─── */}
      {phase !== 'world_intro' && (
        <View style={styles.inputPreview}>
          {pattern.map((_, i) => (
            <View
              key={i}
              style={[
                styles.inputDot,
                i < userInput.length && styles.inputDotFilled,
                phase === 'result_delay' && (roundCorrect ? styles.inputDotSuccess : styles.inputDotError),
              ]}
            />
          ))}
        </View>
      )}

      {/* Exit Button */}
      <View style={styles.controls}>
        <GameButton
          title={Platform.OS === 'web' ? 'Panele Dön' : 'Ana Sayfa'}
          variant="secondary"
          onPress={() =>
            Platform.OS === 'web'
              ? navigationService.goToDashboard('game_exit_web')
              : navigationService.goToProfilePicker('game_exit_mobile')
          }
        />
      </View>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  statusText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    color: '#A855F7',
    marginVertical: 10,
  },
  statusRecall: { color: '#E879F9' },
  statusSuccess: { color: '#22C55E' },
  statusError: { color: '#EF4444' },
  playArea: {
    width: 320,
    height: 320,
    position: 'relative',
    alignSelf: 'center',
    marginVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    overflow: 'hidden',
  },
  sandEffect: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  starEffect: {
    ...StyleSheet.absoluteFillObject,
  },
  starIcon: {
    position: 'absolute',
    fontSize: 16,
    color: '#FCD34D',
    opacity: 0.3,
  },
  crystalNode: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E1B4B',
    borderWidth: 2,
    borderColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -25,
    marginTop: -25,
  },
  crystalNodeSelected: {
    borderColor: '#A855F7',
    backgroundColor: '#2D1B69',
  },
  crystalNodeGlowing: {
    borderColor: '#E879F9',
    backgroundColor: '#4A044E',
  },
  glowRing: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: '#E879F9',
  },
  crystalEmoji: {
    fontSize: 24,
  },
  worldIntroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  mascotEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  worldTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  worldDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  introBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  introBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  inputPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  inputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  inputDotFilled: {
    backgroundColor: '#E879F9',
    borderColor: '#E879F9',
  },
  inputDotSuccess: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  inputDotError: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  cardHeader: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 1.5,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F59E0B',
    textAlign: 'center',
    textShadowColor: 'rgba(245, 158, 11, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  crystalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  crystalCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  summaryCrystalEmoji: {
    fontSize: 32,
  },
  crystalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  crystalValue: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  towerEnergyContainer: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  towerEnergyLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  towerGraphicContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 40,
  },
  largeTowerEmoji: {
    fontSize: 100,
    lineHeight: 120,
  },
  energyBarTrackVertical: {
    height: '100%',
    width: 32,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: '#334155',
  },
  energyBarFillVertical: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  fillLightning: {
    position: 'absolute',
    top: '10%',
    fontSize: 14,
    opacity: 0.8,
  },
  towerEnergyValue: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  cardFooter: {
    width: '100%',
    marginTop: 10,
  },
  controls: {
    marginTop: 'auto',
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    gap: 16,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
