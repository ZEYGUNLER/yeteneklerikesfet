import { ProgressionData, ChildAchievement } from '../types/progression.types';
import { ACHIEVEMENTS } from '../config/unlockables.config';

export type GameMetrics = {
  score: number;
  accuracy: number;
  comboCount: number;
  isPerfect: boolean;
  gameId: string;
};

export const achievementEngine = {
  checkGameAchievements(
    currentData: ProgressionData,
    metrics: GameMetrics
  ): string[] {
    const newlyUnlocked: string[] = [];
    const existingIds = currentData.achievements.map(a => a.id);

    // 1. Memory Master
    if (metrics.gameId === 'memory' && metrics.isPerfect && !existingIds.includes('memory_master_1')) {
      newlyUnlocked.push('memory_master_1');
    }

    // 2. Focus Guardian
    if (metrics.gameId === 'attention' && metrics.accuracy > 0.95 && !existingIds.includes('focus_guardian_1')) {
      newlyUnlocked.push('focus_guardian_1');
    }

    // 3. Speed Champion
    if (metrics.gameId === 'reaction' && metrics.score > 2000 && !existingIds.includes('speed_champion_1')) {
      newlyUnlocked.push('speed_champion_1');
    }

    return newlyUnlocked;
  },

  checkConsistencyAchievements(currentData: ProgressionData): string[] {
    const newlyUnlocked: string[] = [];
    const existingIds = currentData.achievements.map(a => a.id);

    // Streak Explorer
    if (currentData.streakDays >= 3 && !existingIds.includes('streak_explorer_3')) {
      newlyUnlocked.push('streak_explorer_3');
    }

    return newlyUnlocked;
  }
};
