export type ProgressionData = {
  childId: string;
  xp: number;
  level: number;
  stars: number;
  unlockedItems: string[]; // IDs of unlockables
  achievements: ChildAchievement[];
  totalGamesPlayed: number;
  lastPlayedAt?: string;
  streakDays: number;
  activeAura?: string; // cosmetic aura color/effect
  activeTitle?: string; // e.g. "Crystal Explorer"
  worldState: {
    unlockedLandmarks: string[]; // IDs of landmarks revealed on the map
    mascotFriendshipLevels: Record<string, number>; // Interaction/milestone tracking per mascot
  };
};

export type ChildAchievement = {
  id: string;
  unlockedAt: string;
  seen: boolean;
};

export type Unlockable = {
  id: string;
  name: string;
  type: 'avatar' | 'theme' | 'particle' | 'border' | 'decoration' | 'ambient';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    level?: number;
    achievementId?: string;
    xp?: number;
    gamesPlayed?: number;
  };
  visualAsset?: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'mastery' | 'consistency' | 'speed' | 'focus' | 'milestone';
};

export type LevelThreshold = {
  level: number;
  xpRequired: number;
  rewards: {
    unlockableIds?: string[];
    stars?: number;
  };
};
