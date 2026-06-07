import { useLocalSearchParams } from 'expo-router';
import { AttentionGameScreen } from '@/screens/games/AttentionGameScreen';
import { MemoryGameScreen } from '@/screens/games/MemoryGameScreen';
import { ReactionGameScreen } from '@/screens/games/ReactionGameScreen';
import { PatternMemoryScreen } from '@/screens/games/PatternMemoryScreen';
import { VisualHuntScreen } from '@/screens/games/VisualHuntScreen';
import { SequenceRecallScreen } from '@/screens/games/SequenceRecallScreen';
import { SoundMemoryScreen } from '@/screens/games/SoundMemoryScreen';
import { LogicPuzzleScreen } from '@/screens/games/LogicPuzzleScreen';

export default function GamePlayRoute() {
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();

  if (gameId === 'memory') {
    return <MemoryGameScreen />;
  }

  if (gameId === 'pattern_memory') {
    return <PatternMemoryScreen />;
  }

  if (gameId === 'reaction') {
    return <ReactionGameScreen />;
  }

  if (gameId === 'visual_hunt') {
    return <VisualHuntScreen />;
  }

  if (gameId === 'sequence_recall') {
    return <SequenceRecallScreen />;
  }

  if (gameId === 'sound_memory') {
    return <SoundMemoryScreen />;
  }

  if (gameId === 'logic_puzzle') {
    return <LogicPuzzleScreen />;
  }

  if (gameId === 'attention') {
    return <AttentionGameScreen />;
  }

  // Fallback
  return <AttentionGameScreen />;
}

