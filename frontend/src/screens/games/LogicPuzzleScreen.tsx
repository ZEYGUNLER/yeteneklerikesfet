import React, { useState, useCallback, useRef } from 'react';
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

// Puzzle types: shape matching, directional, color logic
// ─── Puzzle Definitions ───────────────────────────────────────────────────────
interface Puzzle {
  question: string;
  emoji: string;
  options: string[];
  correctIndex: number;
  hint: string; // shown after 2 wrong attempts (Soft Failure Logic)
}

const PUZZLE_BANK: Puzzle[] = [
  {
    question: 'Hangisi farklı?',
    emoji: '🟦🟦🟦🟥🟦',
    options: ['🟦 Mavi', '🟥 Kırmızı', '🟩 Yeşil'],
    correctIndex: 1,
    hint: 'Farklı rengi ara...',
  },
  {
    question: 'Sıradaki şekil hangisi?',
    emoji: '🔺 🔺 🔵 🔺 🔺 ?',
    options: ['🔵 Daire', '🔺 Üçgen', '🟥 Kare'],
    correctIndex: 0,
    hint: 'Deseni takip et: 🔺🔺🔵...',
  },
  {
    question: 'Büyükten küçüğe hangisi doğru?',
    emoji: '🐘 🐒 🐁',
    options: ['🐁 → 🐒 → 🐘', '🐘 → 🐒 → 🐁', '🐒 → 🐘 → 🐁'],
    correctIndex: 1,
    hint: 'Fili düşün: çok büyük!',
  },
  {
    question: 'Kutuyu dolduran hangisi?',
    emoji: '⬛ + ? = 🟩',
    options: ['🟥 Kırmızı', '🟦 Mavi', '🟩 Yeşil'],
    correctIndex: 2,
    hint: 'Aynı rengi ara...',
  },
  {
    question: 'Kural: Her grup 3 tane. Eksik kaç?',
    emoji: '⭐⭐⭐ | 🌙🌙? | ☀️☀️☀️',
    options: ['1', '2', '3'],
    correctIndex: 0,
    hint: 'Diğer gruplar 3\'er tane...',
  },
  {
    question: 'Hangisi tepede?',
    emoji: '🏔️ veya 🏝️ veya 🏕️',
    options: ['🏝️ Ada', '🏔️ Dağ', '🏕️ Kamp'],
    correctIndex: 1,
    hint: 'En yüksek yeri bul...',
  },
  {
    question: 'Sıra: 2, 4, 6, ?',
    emoji: '2️⃣ → 4️⃣ → 6️⃣ → ?',
    options: ['7', '8', '9'],
    correctIndex: 1,
    hint: 'Her seferinde 2 artıyor...',
  },
  {
    question: 'Hangi şekil simetrik?',
    emoji: '◆ veya 🔷 veya 🔻',
    options: ['◆ Elmas', '🔷 Dörtgen', '🔻 Ters Üçgen'],
    correctIndex: 0,
    hint: 'İki tarafı birbirine eşit olan...',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function LogicPuzzleScreen() {
  const { status, finishGame } = useGameSession({ gameId: 'logic_puzzle' });
  const { metrics, recordInteraction, getFinalMetrics } = useGameMetrics();
  const { adaptiveParams, recordAdaptiveEvent, getAdaptiveInsights } = useAdaptiveEngine();
  const { feedback, triggerFeedback } = useGameFeedback('logic_puzzle', adaptiveParams.encouragementMode);

  const [round, setRound] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
  const lastTapRef = useRef<number>(Date.now()); // Phase G7: reaction time tracking

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(1)).current;

  const puzzle = PUZZLE_BANK[round % PUZZLE_BANK.length];

  const handleOptionTap = useCallback((optionIndex: number) => {
    if (resultCorrect !== null || status !== 'playing') return;

    const now = Date.now();
    const reactionTime = now - lastTapRef.current;
    lastTapRef.current = now;

    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === puzzle.correctIndex;

    if (isCorrect) {
      // ─── Correct: success pulse ────────────────────────────────────────
      interactionEngine.triggerSuccess();
      triggerFeedback('correct');
      setResultCorrect(true);
      recordInteraction(true);
      recordAdaptiveEvent(true, reactionTime);
      setWrongAttempts(0);
      setShowHint(false);

      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(successAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          const final = getFinalMetrics();
          void finishGame({ 
            score: final.score, 
            accuracy: final.accuracy, 
            metadata: { ...final.metadata, adaptive: getAdaptiveInsights() } 
          });
        } else {
          setRound((r) => r + 1);
          setResultCorrect(null);
          setSelectedOption(null);
        }
      }, 900);

    } else {
      // ─── Wrong: Soft Failure Logic ──────────────────────────────────────
      // Phase G7: in support mode, hint appears after only 1 wrong attempt
      interactionEngine.triggerWarning();
      triggerFeedback('incorrect');
      recordInteraction(false);
      recordAdaptiveEvent(false, reactionTime);

      const newWrongCount = wrongAttempts + 1;
      setWrongAttempts(newWrongCount);

      const hintThreshold = adaptiveParams.encouragementMode === 'support' ? 1 : 2;
      if (newWrongCount >= hintThreshold) {
        setShowHint(true); // Progressive guidance
      }

      // Shake the wrong option
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start(() => setSelectedOption(null));

      setResultCorrect(null); // Allow retry — no dead-end states
    }
  }, [puzzle, resultCorrect, wrongAttempts, round, status, adaptiveParams.encouragementMode]);

  const stats = [
    { label: 'Bulmaca', value: `${round + 1}/${TOTAL_ROUNDS}` },
    { label: 'Skor', value: metrics.score },
    { label: feedback?.text ? '' : 'İpucu', value: wrongAttempts >= 2 ? '✓' : '-' },
  ];

  return (
    <GameLayout>
      <GameHeader title="Zihin Dövmeci" stats={stats} progress={(round + 1) / TOTAL_ROUNDS} />

      {/* ─── Puzzle Card ─── */}
      <Animated.View style={[styles.puzzleCard, { transform: [{ scale: successAnim }] }]}>
        <Text style={styles.question}>{puzzle.question}</Text>
        <Text style={styles.puzzleEmoji}>{puzzle.emoji}</Text>

        {/* ─── Hint (Soft Failure — shown after 2 wrong) ─── */}
        {showHint && (
          <View style={styles.hintBox}>
            <Text style={styles.hintIcon}>💡</Text>
            <Text style={styles.hintText}>{puzzle.hint}</Text>
          </View>
        )}
      </Animated.View>

      {/* ─── Options ─── */}
      <View style={styles.options}>
        {puzzle.options.map((option, idx) => (
          <Animated.View
            key={idx}
            style={selectedOption === idx && resultCorrect === null
              ? { transform: [{ translateX: shakeAnim }] }
              : {}}
          >
            <TouchableOpacity
              onPress={() => handleOptionTap(idx)}
              activeOpacity={0.8}
              disabled={resultCorrect !== null}
              style={[
                styles.option,
                resultCorrect === true && selectedOption === idx && styles.optionCorrect,
              ]}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* ─── Partial success feedback ─── */}
      {feedback?.text && (
        <Text style={[
          styles.feedbackText,
          resultCorrect ? styles.feedbackSuccess : styles.feedbackError,
        ]}>
          {feedback.text}
        </Text>
      )}

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
  puzzleCard: {
    backgroundColor: '#1C0A0A',
    borderRadius: 20, borderWidth: 1.5, borderColor: '#EF4444',
    padding: 20, marginVertical: 8,
    alignItems: 'center', gap: 8,
  },
  question: {
    fontSize: 17, fontWeight: '800',
    color: '#FCA5A5', textAlign: 'center',
  },
  puzzleEmoji: {
    fontSize: 28, textAlign: 'center',
    letterSpacing: 4, marginVertical: 6,
  },
  hintBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10, padding: 10, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  hintIcon: { fontSize: 18 },
  hintText: {
    color: '#FCA5A5', fontSize: 13, fontWeight: '700',
    flex: 1,
  },
  options: {
    gap: 10, marginVertical: 8,
  },
  option: {
    backgroundColor: '#450A0A',
    borderRadius: 14, borderWidth: 2, borderColor: '#EF4444',
    paddingVertical: 16, paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionCorrect: {
    backgroundColor: '#052E16',
    borderColor: '#22C55E',
  },
  optionText: {
    color: '#FCA5A5', fontWeight: '800', fontSize: 16,
  },
  feedbackText: {
    textAlign: 'center', fontSize: 16,
    fontWeight: '800', marginTop: 4,
  },
  feedbackSuccess: { color: '#22C55E' },
  feedbackError: { color: '#EF4444' },
  controls: { marginTop: 'auto', paddingTop: 8 },
});
