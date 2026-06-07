import { ProgressionData, LevelThreshold } from '../types/progression.types';
import { UNLOCKABLES } from '../config/unlockables.config';
import { persist } from './storage';

export const progressionEngine = {
  // Simple progression formula: Level * 100 + incremental difficulty
  getXPForLevel(level: number): number {
    if (level <= 1) return 0;
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += i * 100;
    }
    return total;
  },

  calculateLevel(xp: number): number {
    let level = 1;
    while (xp >= this.getXPForLevel(level + 1)) {
      level++;
    }
    return level;
  },

  getNextLevelThreshold(currentLevel: number): number {
    return this.getXPForLevel(currentLevel + 1);
  },

  calculateGameXP(score: number, accuracy: number, focusTime: number): number {
    // Base XP for completion
    const baseXP = 50;
    // Accuracy bonus (up to 30)
    const accuracyBonus = Math.floor(accuracy * 30);
    // Performance bonus based on score (capped at 20)
    const scoreBonus = Math.min(Math.floor(score / 100), 20);
    
    return baseXP + accuracyBonus + scoreBonus;
  },

  checkNewUnlocks(oldLevel: number, newLevel: number, unlockedIds: string[]): string[] {
    const newlyUnlocked = UNLOCKABLES.filter(item => {
      if (unlockedIds.includes(item.id)) return false;
      if (item.requirement.level && item.requirement.level <= newLevel && item.requirement.level > oldLevel) {
        return true;
      }
      return false;
    });

    return newlyUnlocked.map(item => item.id);
  },

  getInitialData(childId: string): ProgressionData {
    return {
      childId,
      xp: 0,
      level: 1,
      stars: 0,
      unlockedItems: [],
      achievements: [],
      totalGamesPlayed: 0,
      streakDays: 0,
      worldState: {
        unlockedLandmarks: [],
        mascotFriendshipLevels: {},
      },
    };
  },

  async getLevelForChild(childId: string): Promise<number> {
    try {
      const key = `yk.progression.${childId}`;
      const saved = await persist.get(key);
      if (saved) {
        const data = JSON.parse(saved);
        return data.level || 1;
      }
      return 1;
    } catch {
      return 1;
    }
  }
};
