import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ProgressionData, ChildAchievement } from '../types/progression.types';
import { progressionEngine } from '../services/progressionEngine';
import { achievementEngine, GameMetrics } from '../services/achievementEngine';
import { worldMemoryEngine } from '../services/worldMemoryEngine';
import { persist } from '../services/storage';
import { useChildContext } from './ChildContext';

const PROGRESSION_KEY_PREFIX = 'yk.progression.';

type ProgressionContextType = {
  data: ProgressionData | null;
  addXP: (amount: number, gameMetrics?: GameMetrics) => Promise<{
    leveledUp: boolean;
    newAchievements: string[];
    newUnlocks: string[];
  }>;
  isLoading: boolean;
};

const ProgressionContext = createContext<ProgressionContextType | undefined>(undefined);

export const ProgressionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedChild } = useChildContext();
  const [data, setData] = useState<ProgressionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedChild) {
        setData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const key = `${PROGRESSION_KEY_PREFIX}${selectedChild.id}`;
      const saved = await persist.get(key);
      
      if (saved) {
        setData(JSON.parse(saved));
      } else {
        const initial = progressionEngine.getInitialData(selectedChild.id);
        setData(initial);
        await persist.set(key, JSON.stringify(initial));
      }
      setIsLoading(false);
    };

    loadData();
  }, [selectedChild]);

  const addXP = useCallback(async (amount: number, gameMetrics?: GameMetrics) => {
    if (!data || !selectedChild) return { leveledUp: false, newAchievements: [], newUnlocks: [] };

    const oldLevel = data.level;
    const newXP = data.xp + amount;
    const newLevel = progressionEngine.calculateLevel(newXP);
    const leveledUp = newLevel > oldLevel;

    // Safely fallback arrays/objects in case old local storage data doesn't have them
    const safeUnlockedItems = data.unlockedItems || [];
    const safeAchievements = data.achievements || [];
    const safeWorldState = data.worldState || { unlockedLandmarks: [], mascotFriendshipLevels: {} };

    // Check achievements
    let newAchievementIds: string[] = [];
    if (gameMetrics) {
      newAchievementIds = achievementEngine.checkGameAchievements({ ...data, achievements: safeAchievements }, gameMetrics);
    }

    // Check unlocks
    const newUnlockIds = progressionEngine.checkNewUnlocks(oldLevel, newLevel, safeUnlockedItems);

    const updatedAchievements: ChildAchievement[] = [
      ...safeAchievements,
      ...newAchievementIds.map(id => ({ id, unlockedAt: new Date().toISOString(), seen: false }))
    ];

    const updatedData: ProgressionData = {
      ...data,
      xp: newXP,
      level: newLevel,
      unlockedItems: [...safeUnlockedItems, ...newUnlockIds],
      achievements: updatedAchievements,
      totalGamesPlayed: (data.totalGamesPlayed || 0) + (gameMetrics ? 1 : 0),
      lastPlayedAt: new Date().toISOString(),
      worldState: safeWorldState,
    };

    // Evaluate landmarks
    const newLandmarkIds = worldMemoryEngine.evaluateLandmarks(updatedData);
    if (newLandmarkIds.length > 0) {
      updatedData.worldState.unlockedLandmarks = [
        ...(updatedData.worldState.unlockedLandmarks || []),
        ...newLandmarkIds,
      ];
    }

    setData(updatedData);
    const key = `${PROGRESSION_KEY_PREFIX}${selectedChild.id}`;
    await persist.set(key, JSON.stringify(updatedData));

    return {
      leveledUp,
      newAchievements: newAchievementIds,
      newUnlocks: newUnlockIds
    };
  }, [data, selectedChild]);

  return (
    <ProgressionContext.Provider value={{ data, addXP, isLoading }}>
      {children}
    </ProgressionContext.Provider>
  );
};

export const useProgression = () => {
  const context = useContext(ProgressionContext);
  if (!context) throw new Error('useProgression must be used within ProgressionProvider');
  return context;
};
