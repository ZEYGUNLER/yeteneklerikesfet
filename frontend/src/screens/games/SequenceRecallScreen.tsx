import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Platform,
} from 'react-native';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameMetrics } from '@/hooks/useGameMetrics';
import { useGameFeedback } from '@/hooks/useGameFeedback';
import { useAdaptiveEngine } from '@/hooks/useAdaptiveEngine';
import { GameLayout } from '@/components/games/GameLayout';
import { GameHeader } from '@/components/games/GameHeader';
import { GameButton } from '@/components/games/GameActionCard';
import { navigationService } from '@/navigation/navigation.service';
import { interactionEngine } from '@/services/interactionEngine';

// ─── Config ───────────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 8;
const BASE_SEQUENCE = 3;
const NODE_EMOJIS = ['🟣', '🔵', '🟡', '🟢', '🔴', '🟠'];

// ─── Component ────────────────────────────────────────────────────────────────
export function SequenceRecallScreen() {
  const { status, finishGame } = useGameSession({ gameId: 'sequence_recall' });
  const { metrics, recordInteraction, getFinalMetrics } = useGameMetrics();
  const { adaptiveParams, recordAdaptiveEvent, getAdaptiveInsights } = useAdaptiveEngine();
  const { feedback, triggerFeedback } = useGameFeedback('sequence_recall', adaptiveParams.encouragementMode);

  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<'showing' | 'recall' | 'result'>('showing');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);

  const nodeAnims = useRef(NODE_EMOJIS.map(() => new Animated.Value(1))).current;

  const seqLength = Math.min(BASE_SEQUENCE + Math.floor(round / 2), 7);

  const generateSequence = useCallback(() => {
    return Array.from({ length: seqLength }, () =>
      Math.floor(Math.random() * NODE_EMOJIS.length)
    );
  }, [seqLength]);

  // Phase G7: adapt playback speed for fatigued/frustrated children
  const showSequence = useCallback(async (seq: number[]) => {
    setPhase('showing');
    setUserInput([]);
    setResultCorrect(null);
    const gapMs = Math.round(400 / adaptiveParams.speedMultiplier);
    const holdMs = Math.round(500 / adaptiveParams.speedMultiplier);

    for (let i = 0; i < seq.length; i++) {
      await new Promise<void>((res) => setTimeout(res, gapMs));
      setActiveIndex(seq[i]);

      // Animate that node
      Animated.sequence([
        Animated.timing(nodeAnims[seq[i]], { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(nodeAnims[seq[i]], { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      await new Promise<void>((res) => setTimeout(res, holdMs));
      setActiveIndex(null);
    }

    await new Promise<void>((res) => setTimeout(res, 400));
    setPhase('recall');
  }, [nodeAnims, adaptiveParams.speedMultiplier]);

  const startRound = useCallback(() => {
    const seq = generateSequence();
    setSequence(seq);
    showSequence(seq);
  }, [generateSequence, showSequence]);

  useEffect(() => {
    if (status === 'playing') startRound();
  }, [status, round]);

  // ─── Handle node tap ──────────────────────────────────────────────────────
  const handleNodeTap = (nodeIndex: number) => {
    if (phase !== 'recall' || status !== 'playing') return;

    interactionEngine.triggerLightTap();
    const nextInput = [...userInput, nodeIndex];
    setUserInput(nextInput);

    const expected = sequence[nextInput.length - 1];

    // Animate tapped node
    Animated.sequence([
      Animated.timing(nodeAnims[nodeIndex], { toValue: 1.2, duration: 120, useNativeDriver: true }),
      Animated.timing(nodeAnims[nodeIndex], { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    if (nodeIndex !== expected) {
      interactionEngine.triggerError();
      triggerFeedback('incorrect');
      setResultCorrect(false);
      setPhase('result');
      recordInteraction(false);
      recordAdaptiveEvent(false, 600);
      setTimeout(startRound, 1200);
      return;
    }

    if (nextInput.length === sequence.length) {
      interactionEngine.triggerSuccess();
      triggerFeedback('perfect_round');
      setResultCorrect(true);
      setPhase('result');
      recordInteraction(true);
      recordAdaptiveEvent(true, 400);

      if (round >= TOTAL_ROUNDS) {
        const final = getFinalMetrics();
        void finishGame({ 
          score: final.score, 
          accuracy: final.accuracy, 
          metadata: { ...final.metadata, adaptive: getAdaptiveInsights() } 
        });
        return;
      }
      setTimeout(() => setRound((r) => r + 1), 900);
    }
  };

  const stats = [
    { label: 'Tur', value: `${round}/${TOTAL_ROUNDS}` },
    { label: 'Dizi', value: seqLength },
    { label: 'Skor', value: metrics.score },
  ];

  const phaseText =
    phase === 'showing' ? 'Diziyi izle...' :
    phase === 'recall' ? (feedback?.text || 'Sırası ile tekrarla!') :
    resultCorrect ? '🌊 Harika!' : '❌ Tekrar!';

  return (
    <GameLayout>
      <GameHeader title="Yankı Yolu" stats={stats} progress={round / TOTAL_ROUNDS} />

      <Text style={[
        styles.phaseText,
        phase === 'recall' && styles.phaseRecall,
        resultCorrect === true && styles.phaseSuccess,
        resultCorrect === false && styles.phaseError,
      ]}>
        {phaseText}
      </Text>

      {/* ─── Progress dots showing how far user has gotten ─── */}
      <View style={styles.progressDots}>
        {sequence.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < userInput.length && styles.dotFilled,
              phase === 'showing' && i < sequence.length && styles.dotPending,
            ]}
          />
        ))}
      </View>

      {/* ─── Node Grid ─── */}
      <View style={styles.nodeGrid}>
        {NODE_EMOJIS.map((emoji, idx) => (
          <Animated.View
            key={idx}
            style={[{ transform: [{ scale: nodeAnims[idx] }] }]}
          >
            <TouchableOpacity
              onPress={() => handleNodeTap(idx)}
              disabled={phase !== 'recall'}
              activeOpacity={0.7}
              style={[
                styles.node,
                activeIndex === idx && styles.nodeActive,
                phase !== 'recall' && styles.nodeDisabled,
              ]}
            >
              <Text style={styles.nodeEmoji}>{emoji}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

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
  phaseText: {
    fontSize: 18, fontWeight: '800',
    textAlign: 'center', color: '#06B6D4',
    marginVertical: 10,
  },
  phaseRecall: { color: '#67E8F9' },
  phaseSuccess: { color: '#22C55E' },
  phaseError: { color: '#EF4444' },
  progressDots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: 'rgba(6,182,212,0.2)',
    borderWidth: 1.5, borderColor: '#06B6D4',
  },
  dotFilled: { backgroundColor: '#06B6D4' },
  dotPending: { borderColor: 'rgba(6,182,212,0.4)' },
  nodeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 16,
    paddingHorizontal: 20, marginVertical: 16,
  },
  node: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#082F49',
    borderWidth: 2.5, borderColor: '#06B6D4',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nodeActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#67E8F9',
    shadowOpacity: 0.8,
  },
  nodeDisabled: { opacity: 0.55 },
  nodeEmoji: { fontSize: 36 },
  controls: { marginTop: 'auto', paddingTop: 8 },
});
