import { useState, useEffect, useCallback } from 'react';
import { Platform, StyleSheet, Text, View, Pressable } from 'react-native';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameMetrics } from '@/hooks/useGameMetrics';
import { GameLayout } from '@/components/games/GameLayout';
import { GameHeader } from '@/components/games/GameHeader';
import { GameActionCard, GameButton } from '@/components/games/GameActionCard';
import { navigationService } from '@/navigation/navigation.service';

const GRID_SIZE = 3;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const TOTAL_ROUNDS = 8;
const INITIAL_SEQUENCE_LENGTH = 2;

export function MemoryGameScreen() {
  const { status, error, finishGame } = useGameSession({ gameId: 'memory' });
  const { metrics, recordInteraction, getFinalMetrics } = useGameMetrics();
  const { feedback, triggerFeedback } = useGameFeedback('memory');

  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [highlightedTile, setHighlightedTile] = useState<number | null>(null);

  const [sequenceLength, setSequenceLength] = useState(INITIAL_SEQUENCE_LENGTH);

  // Generate a new random sequence
  const generateSequence = useCallback((length: number) => {
    const newSequence = [];
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * TOTAL_TILES));
    }
    return newSequence;
  }, []);

  // Show the sequence to the user
  const showSequence = useCallback(async (seq: number[]) => {
    setIsShowingSequence(true);
    setHighlightedTile(null);

    for (let i = 0; i < seq.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400)); // Gap between tiles
      setHighlightedTile(seq[i]);
      await new Promise((resolve) => setTimeout(resolve, 600)); // Highlight duration
      setHighlightedTile(null);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsShowingSequence(false);
  }, []);

  // Start a new round
  const startRound = useCallback(async (currentLength: number) => {
    const nextSeq = generateSequence(currentLength);
    setSequence(nextSeq);
    setUserSequence([]);
    setFeedback(null);
    await showSequence(nextSeq);
  }, [generateSequence, showSequence]);

  useEffect(() => {
    if (status === 'playing' && round === 1 && sequence.length === 0) {
      startRound(sequenceLength);
    }
  }, [status, round, sequence.length, startRound, sequenceLength]);

  const handleTilePress = (index: number) => {
    if (isShowingSequence || status !== 'playing' || feedback) return;

    const expectedTile = sequence[userSequence.length];
    const isCorrect = index === expectedTile;
    
    recordInteraction(isCorrect, sequenceLength);
    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);

    if (!isCorrect) {
      setFeedback('error');
      setTimeout(() => proceedToNextRound(false), 1000);
      return;
    }

    if (newUserSequence.length === sequence.length) {
      setFeedback('success');
      setTimeout(() => proceedToNextRound(true), 800);
    }
  };

  const proceedToNextRound = (wasSuccessful: boolean) => {
    if (round >= TOTAL_ROUNDS) {
      const final = getFinalMetrics();
      void finishGame({
        score: final.score,
        accuracy: final.accuracy,
        metadata: { ...final.metadata, perfectRounds, totalRounds: TOTAL_ROUNDS },
      });
      return;
    }

    const nextRound = round + 1;
    setRound(nextRound);
    
    // Increase difficulty every 2 successful rounds
    let nextLength = sequenceLength;
    if (wasSuccessful && nextRound % 2 === 1) {
      nextLength = Math.min(sequenceLength + 1, 8);
      setSequenceLength(nextLength);
    }

    startRound(nextLength);
  };

  const stats = [
    { label: 'Round', value: `${round}/${TOTAL_ROUNDS}` },
    { label: 'Level', value: sequenceLength - 1 },
    { label: 'Score', value: metrics.score },
  ];

  const renderGrid = () => {
    const tiles = [];
    for (let i = 0; i < TOTAL_TILES; i++) {
      const isHighlighted = highlightedTile === i;
      
      tiles.push(
        <Pressable
          key={i}
          disabled={isShowingSequence || status !== 'playing' || !!feedback}
          onPress={() => handleTilePress(i)}
          style={({ pressed }) => [
            styles.tile,
            isHighlighted && styles.tileHighlighted,
            pressed && styles.tilePressed,
            feedback === 'success' && sequence.includes(i) && styles.tileSuccess,
            feedback === 'error' && sequence.includes(i) && styles.tileError,
          ]}
        >
          <View style={[styles.tileInner, isHighlighted && styles.tileInnerHighlighted]} />
        </Pressable>
      );
    }
    return tiles;
  };

  return (
    <GameLayout>
      <GameHeader 
        title="Pattern Memory" 
        stats={stats} 
        progress={round / TOTAL_ROUNDS}
      />

      <Text style={styles.instructions}>
        {isShowingSequence 
          ? "Watch carefully!" 
          : feedback === 'success'
          ? "Great job!"
          : feedback === 'error'
          ? "Oops! Watch again."
          : "Your turn!"}
      </Text>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <GameActionCard containerStyle={styles.gridContainer}>
        <View style={styles.grid}>
          {renderGrid()}
        </View>
      </GameActionCard>

      <View style={styles.controls}>
        <GameButton
          title={Platform.OS === 'web' ? 'Panele Dön' : 'Ana Sayfa'}
          variant="secondary"
          onPress={() => Platform.OS === 'web' 
            ? navigationService.goToDashboard('game_exit_web') 
            : navigationService.goToProfilePicker('game_exit_mobile')
          }
        />
      </View>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  instructions: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginVertical: 10,
  },
  gridContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  grid: {
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    alignContent: 'center',
  },
  tile: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 8,
  },
  tileInner: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
  },
  tilePressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: '#E5E7EB',
  },
  tileHighlighted: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    transform: [{ scale: 1.05 }],
  },
  tileInnerHighlighted: {
    backgroundColor: '#60A5FA',
  },
  tileSuccess: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  tileError: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  errorCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 14,
    gap: 4,
    marginBottom: 10,
  },
  errorTitle: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  errorText: {
    color: '#991B1B',
  },
  controls: {
    marginTop: 'auto',
  },
});
