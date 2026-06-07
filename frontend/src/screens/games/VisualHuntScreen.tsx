import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Dimensions,
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

const { width } = Dimensions.get('window');

// ─── Config ────────────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 8;
const GRID_SIZE = 5; // 5x4 grid = 20 cells
const GRID_COLS = 5;
const GRID_ROWS = 4;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

// Emojis for targets and distractors — visually distinct, child-friendly
const TARGET_EMOJIS = ['⭐', '🌟', '✨', '💫', '🔆'];
const DISTRACTOR_EMOJIS = ['🌀', '💠', '🔷', '🔹', '▪️', '◼️', '⬛', '🟦', '🟪', '🟫'];

// Max distractors per round (sensory safety: no visual chaos)
const MAX_DISTRACTORS = 8;

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Cell {
  id: number;
  emoji: string;
  isTarget: boolean;
  found: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function VisualHuntScreen() {
  const { status, error, finishGame } = useGameSession({ gameId: 'visual_hunt' });
  const { metrics, recordInteraction, getFinalMetrics } = useGameMetrics();
  const { adaptiveParams, recordAdaptiveEvent, getAdaptiveInsights } = useAdaptiveEngine();
  const { feedback, triggerFeedback } = useGameFeedback('visual_hunt', adaptiveParams.encouragementMode);

  const [round, setRound] = useState(1);
  const [cells, setCells] = useState<Cell[]>([]);
  const [targetEmoji, setTargetEmoji] = useState('⭐');
  const [targetsLeft, setTargetsLeft] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const lastTapRef = useRef<number>(Date.now()); // Phase G7: reaction time tracking

  const shakeAnim = useRef(new Animated.Value(0)).current;
  // Phase G7: complexityDelta adjusts distractor count — less when struggling, more when confident
  const baseDistractorCount = Math.min(3 + round, MAX_DISTRACTORS);
  const distractorCount = Math.max(
    1,
    Math.min(MAX_DISTRACTORS, baseDistractorCount + adaptiveParams.complexityDelta)
  );

  // ─── Generate a new grid ───────────────────────────────────────────────────
  const generateGrid = useCallback(() => {
    const target = TARGET_EMOJIS[Math.floor(Math.random() * TARGET_EMOJIS.length)];
    setTargetEmoji(target);

    const targetCount = 2 + Math.floor(round / 3); // scales: 2 → 4 targets
    const allCells: Cell[] = [];
    const positions = new Set<number>();

    // Place targets
    while (positions.size < targetCount) {
      positions.add(Math.floor(Math.random() * TOTAL_CELLS));
    }
    // Place distractors
    let distractorPlaced = 0;
    while (positions.size < Math.min(TOTAL_CELLS, targetCount + distractorCount)) {
      positions.add(Math.floor(Math.random() * TOTAL_CELLS));
    }

    const posArray = [...positions];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const isTarget = posArray.indexOf(i) < targetCount;
      const isDistractor = posArray.indexOf(i) >= targetCount;
      allCells.push({
        id: i,
        emoji: isTarget
          ? target
          : isDistractor
          ? DISTRACTOR_EMOJIS[Math.floor(Math.random() * DISTRACTOR_EMOJIS.length)]
          : '',
        isTarget,
        found: false,
      });
    }

    setCells(allCells);
    setTargetsLeft(targetCount);
    setRoundOver(false);
  }, [round, distractorCount]);

  useEffect(() => {
    if (status === 'playing') generateGrid();
  }, [status, round]);

  // ─── Handle cell tap ────────────────────────────────────────────────────────
  const handleCellTap = (cellId: number) => {
    if (roundOver || status !== 'playing') return;

    const cell = cells[cellId];
    if (!cell || cell.found || !cell.emoji) return;

    const now = Date.now();
    const reactionTime = now - lastTapRef.current;
    lastTapRef.current = now;

    if (cell.isTarget) {
      interactionEngine.triggerSuccess();
      const updated = cells.map((c) => c.id === cellId ? { ...c, found: true } : c);
      setCells(updated);

      const newLeft = targetsLeft - 1;
      setTargetsLeft(newLeft);
      recordInteraction(true);
      recordAdaptiveEvent(true, reactionTime);

      if (newLeft === 0) {
        triggerFeedback('perfect_round');
        setRoundOver(true);
        setTimeout(() => nextRound(), 900);
      }
    } else {
      // Wrong tap — shake animation (sensory safe, no harsh sound)
      interactionEngine.triggerWarning();
      recordInteraction(false);
      recordAdaptiveEvent(false, reactionTime);
      triggerFeedback('incorrect');

      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  const nextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      const final = getFinalMetrics();
      void finishGame({ 
        score: final.score, 
        accuracy: final.accuracy, 
        metadata: { ...final.metadata, adaptive: getAdaptiveInsights() } 
      });
      return;
    }
    setRound((r) => r + 1);
  };

  const stats = [
    { label: 'Tur', value: `${round}/${TOTAL_ROUNDS}` },
    { label: 'Kalan', value: targetsLeft },
    { label: 'Skor', value: metrics.score },
  ];

  return (
    <GameLayout>
      <GameHeader title="Kaşif Gözü" stats={stats} progress={round / TOTAL_ROUNDS} />

      {/* ─── Target indicator ─── */}
      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Bul:</Text>
        <View style={styles.targetBadge}>
          <Text style={styles.targetEmoji}>{targetEmoji}</Text>
        </View>
        <Text style={styles.targetCount}>× {targetsLeft}</Text>
      </View>

      {/* ─── Feedback text ─── */}
      {feedback?.text && (
        <Text style={styles.feedbackText}>{feedback.text}</Text>
      )}

      {/* ─── Grid ─── */}
      <Animated.View
        style={[styles.grid, { transform: [{ translateX: shakeAnim }] }]}
      >
        {cells.map((cell) => (
          <TouchableOpacity
            key={cell.id}
            onPress={() => handleCellTap(cell.id)}
            activeOpacity={cell.emoji ? 0.7 : 1}
            disabled={!cell.emoji || cell.found || roundOver}
            style={[
              styles.cell,
              cell.found && styles.cellFound,
              !cell.emoji && styles.cellEmpty,
            ]}
          >
            <Text style={[styles.cellEmoji, cell.found && styles.cellEmojiFound]}>
              {cell.found ? '✅' : cell.emoji}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

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

const CELL_SIZE = Math.floor((width - 80) / GRID_COLS) - 4;

const styles = StyleSheet.create({
  targetRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    marginVertical: 10,
  },
  targetLabel: {
    fontSize: 16, fontWeight: '800', color: '#F59E0B',
  },
  targetBadge: {
    backgroundColor: '#451A03',
    borderRadius: 12, borderWidth: 2, borderColor: '#F59E0B',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  targetEmoji: { fontSize: 26 },
  targetCount: {
    fontSize: 20, fontWeight: '900', color: '#FDE68A',
  },
  feedbackText: {
    textAlign: 'center', fontSize: 15,
    fontWeight: '700', color: '#F59E0B',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 4,
    marginVertical: 8,
  },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    backgroundColor: '#1C0A00',
    borderRadius: 10,
    borderWidth: 1.5, borderColor: '#451A03',
    justifyContent: 'center', alignItems: 'center',
  },
  cellEmpty: {
    backgroundColor: '#0F0500',
    borderColor: 'transparent',
  },
  cellFound: {
    backgroundColor: '#052E16',
    borderColor: '#22C55E',
  },
  cellEmoji: { fontSize: CELL_SIZE * 0.45 },
  cellEmojiFound: { opacity: 0.7 },
  controls: {
    marginTop: 'auto', paddingTop: 8,
  },
});
