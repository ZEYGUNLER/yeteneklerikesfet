import { useLocalSearchParams } from 'expo-router';
import { AttentionGameScreen } from '@/screens/games/AttentionGameScreen';
import { MemoryGameScreen } from '@/screens/games/MemoryGameScreen';
import { ReactionGameScreen } from '@/screens/games/ReactionGameScreen';

export default function GamePlayRoute() {
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();

  if (gameId === 'memory') {
    return <MemoryGameScreen />;
  }

  if (gameId === 'logic') {
    return <ReactionGameScreen />;
  }

  return <AttentionGameScreen />;
}

