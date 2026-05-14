/**
 * Centralized identity configuration for Game Worlds.
 * Defines the thematic DNA, color palettes, and emotional tones for each game.
 */

export type GameIdentityType = 'memory' | 'attention' | 'logic';

export interface GameIdentity {
  id: GameIdentityType;
  title: string;
  worldName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    glow: string;
  };
  particles: {
    type: 'spores' | 'lightning' | 'shield';
    count: number;
    color: string;
  };
  audio: {
    profile: 'magical' | 'focused' | 'energetic';
  };
  animations: {
    personality: 'soft' | 'sharp' | 'steady';
  };
  typography: {
    titleFont: string;
    letterSpacing: number;
    textCase: 'uppercase' | 'none';
  };
  intro: {
    icon: string;
    description: string;
  };
}

export const GAME_IDENTITIES: Record<GameIdentityType, GameIdentity> = {
  memory: {
    id: 'memory',
    title: 'Hafıza Bahçesi',
    worldName: 'Magical Memory Garden',
    colors: {
      primary: '#8B5CF6', // Purple
      secondary: '#4C1D95',
      accent: '#D8B4FE',
      background: '#2E1065',
      surface: '#4C1D95',
      glow: 'rgba(139, 92, 246, 0.4)',
    },
    particles: {
      type: 'spores',
      count: 15,
      color: '#D8B4FE',
    },
    audio: {
      profile: 'magical',
    },
    animations: {
      personality: 'soft',
    },
    typography: {
      titleFont: 'System',
      letterSpacing: 2,
      textCase: 'none',
    },
    intro: {
      icon: '🌿',
      description: 'Büyülü bahçede gizli desenleri bulmaya hazır mısın?',
    },
  },
  logic: {
    id: 'logic',
    title: 'Hız Meydan Okuması',
    worldName: 'Lightning Chase',
    colors: {
      primary: '#0EA5E9', // Sky Blue
      secondary: '#0369A1',
      accent: '#FDE047', // Lightning Yellow
      background: '#082F49',
      surface: '#0C4A6E',
      glow: 'rgba(14, 165, 233, 0.4)',
    },
    particles: {
      type: 'lightning',
      count: 20,
      color: '#FDE047',
    },
    audio: {
      profile: 'energetic',
    },
    animations: {
      personality: 'sharp',
    },
    typography: {
      titleFont: 'System',
      letterSpacing: 1,
      textCase: 'uppercase',
    },
    intro: {
      icon: '⚡',
      description: 'Işık hızında hedefleri yakala ve enerjiyi topla!',
    },
  },
  attention: {
    id: 'attention',
    title: 'Dikkat Görevi',
    worldName: 'Guardian Focus',
    colors: {
      primary: '#10B981', // Emerald
      secondary: '#064E3B',
      accent: '#F59E0B', // Gold
      background: '#064E3B',
      surface: '#065F46',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
    particles: {
      type: 'shield',
      count: 8,
      color: '#FCD34D',
    },
    audio: {
      profile: 'focused',
    },
    animations: {
      personality: 'steady',
    },
    typography: {
      titleFont: 'System',
      letterSpacing: 4,
      textCase: 'uppercase',
    },
    intro: {
      icon: '🛡️',
      description: 'Dikkatini odakla ve kalkanı her türlü uyarana karşı koru.',
    },
  },
};

export const getIdentity = (id: string): GameIdentity => {
  return GAME_IDENTITIES[id as GameIdentityType] || GAME_IDENTITIES.attention;
};
