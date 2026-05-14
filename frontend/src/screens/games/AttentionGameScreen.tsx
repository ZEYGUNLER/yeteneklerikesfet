import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameMetrics } from '@/hooks/useGameMetrics';
import { GameLayout } from '@/components/games/GameLayout';
import { GameHeader } from '@/components/games/GameHeader';
import { GameActionCard, GameButton } from '@/components/games/GameActionCard';
import { navigationService } from '@/navigation/navigation.service';

type Prompt = 'GO' | 'WAIT';

const TOTAL_ROUNDS = 12;

function nextPrompt(): Prompt {
  return Math.random() < 0.6 ? 'GO' : 'WAIT';
}

export function AttentionGameScreen() {
  const { gameId = 'attention' } = useLocalSearchParams<{ gameId?: string }>();
  
  // Standardized Session & Metrics
  const { status, error, finishGame } = useGameSession({ gameId });
  const { metrics, recordInteraction, getFinalMetrics } = useGameMetrics();
  const { feedback, triggerFeedback } = useGameFeedback('attention');

  const [round, setRound] = useState(1);
  const [prompt, setPrompt] = useState<Prompt>(() => nextPrompt());

  const title = useMemo(() => {
    if (gameId === 'attention') return 'Attention Game';
    if (gameId === 'memory') return 'Memory Game (MVP)';
    if (gameId === 'logic') return 'Logic Game (MVP)';
    return 'Game';
  }, [gameId]);

  const handleTap = () => {
    if (status !== 'playing') return;

    const isCorrect = prompt === 'GO';
    recordInteraction(isCorrect);

    if (round >= TOTAL_ROUNDS) {
      const final = getFinalMetrics();
      void finishGame({
        score: final.score,
        accuracy: final.accuracy,
        metadata: final.metadata,
      });
      return;
    }

    setRound((v) => v + 1);
    setPrompt(nextPrompt());
  };

  const stats = [
    { label: 'Round', value: `${Math.min(round, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}` },
    { label: 'Correct', value: metrics.correct },
    { label: 'Attempts', value: metrics.attempts },
  ];

  return (
    <GameLayout>
      <GameHeader 
        title={title} 
        stats={stats} 
        progress={round / TOTAL_ROUNDS}
      />

      <Text style={styles.subtitle}>
        Tap the large button when you see <Text style={styles.bold}>GO</Text>. Avoid tapping on{' '}
        <Text style={styles.bold}>WAIT</Text>.
      </Text>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <GameActionCard>
        <Text style={[styles.promptText, prompt === 'GO' ? styles.go : styles.wait]}>
          {status === 'starting'
            ? 'Starting...'
            : status === 'ending'
              ? 'Submitting...'
              : prompt}
        </Text>
      </GameActionCard>

      <View style={styles.controls}>
        <GameButton
          title="Tap"
          onPress={handleTap}
          disabled={status !== 'playing'}
        />

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
  subtitle: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '900',
    color: '#111827',
  },
  errorCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 14,
    gap: 4,
  },
  errorTitle: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  errorText: {
    color: '#991B1B',
  },
  promptText: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 2,
  },
  go: {
    color: '#10B981',
  },
  wait: {
    color: '#EF4444',
  },
  controls: {
    gap: 8,
    marginTop: 'auto',
  },
});


