import { ProgressionData } from '@/types/progression.types';

export interface LandmarkConfig {
  id: string;
  worldId: string;
  icon: string;
  unlockCondition: (data: ProgressionData) => boolean;
}

export const LANDMARKS: Record<string, LandmarkConfig> = {
  memory_crystal: {
    id: 'memory_crystal',
    worldId: 'memory',
    icon: '💎',
    unlockCondition: (data) => data.achievements.some((a) => a.id === 'memory_master_1'),
  },
  focus_statue: {
    id: 'focus_statue',
    worldId: 'attention',
    icon: '🗿',
    unlockCondition: (data) => data.achievements.some((a) => a.id === 'focus_guardian_1'),
  },
  speed_comet: {
    id: 'speed_comet',
    worldId: 'reaction',
    icon: '☄️',
    unlockCondition: (data) => data.achievements.some((a) => a.id === 'speed_champion_1'),
  },
};

/**
 * PHASE G8B — World Memory Engine
 *
 * The world remembers the child's progress.
 * Evaluates state to unlock persistent landmarks and increase mascot friendship.
 */
class WorldMemoryEngine {
  /**
   * Evaluates if any new landmarks should be unlocked based on current progression.
   * Returns an array of newly unlocked landmark IDs.
   */
  evaluateLandmarks(data: ProgressionData): string[] {
    const newlyUnlocked: string[] = [];
    const currentLandmarks = new Set(data.worldState.unlockedLandmarks || []);

    for (const [id, config] of Object.entries(LANDMARKS)) {
      if (!currentLandmarks.has(id) && config.unlockCondition(data)) {
        newlyUnlocked.push(id);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Increases friendship level with a specific mascot based on game completion.
   */
  incrementMascotFriendship(data: ProgressionData, mascotId: string, amount: number = 1): ProgressionData {
    const currentLevel = data.worldState.mascotFriendshipLevels?.[mascotId] || 0;
    
    return {
      ...data,
      worldState: {
        ...data.worldState,
        mascotFriendshipLevels: {
          ...data.worldState.mascotFriendshipLevels,
          [mascotId]: currentLevel + amount,
        },
      },
    };
  }
}

export const worldMemoryEngine = new WorldMemoryEngine();
