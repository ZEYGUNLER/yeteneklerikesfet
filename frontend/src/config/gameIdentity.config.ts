/**
 * Centralized identity configuration for Game Worlds.
 * Defines the thematic DNA, color palettes, and emotional tones for each game.
 */

export type GameIdentityType =
  | 'memory'
  | 'attention'
  | 'reaction'
  | 'pattern_memory'
  | 'visual_hunt'
  | 'sequence_recall'
  | 'sound_memory'
  | 'logic_puzzle';

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
  mascotId?: string;
  ambientMotion?: 'gentle' | 'pulse' | 'wave' | 'static';
  lightingTone?: 'warm' | 'cool' | 'neutral';
}

export const GAME_IDENTITIES: Partial<Record<GameIdentityType, GameIdentity>> = {
  memory: {
    id: 'memory',
    title: 'Hazine Haritası',
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
      icon: '🗺️',
      description: 'Gizemli ada haritasında kayıp yolları planlamaya hazır mısın?',
    },
    mascotId: 'memory_fox',
    ambientMotion: 'gentle',
    lightingTone: 'warm',
  },
  reaction: {
    id: 'reaction',
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
    mascotId: 'spark_rabbit',
    ambientMotion: 'pulse',
    lightingTone: 'cool',
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
    mascotId: 'lantern_owl',
    ambientMotion: 'static',
    lightingTone: 'neutral',
  },
};

export const getIdentity = (id: string): GameIdentity => {
  return (GAME_IDENTITIES[id as GameIdentityType] as GameIdentity) || GAME_IDENTITIES.attention;
};

// ─── G6 New Game Identities ───────────────────────────────────────────────────
const G6_IDENTITIES: Partial<Record<GameIdentityType, GameIdentity>> = {
  pattern_memory: {
    id: 'pattern_memory' as any,
    title: 'Kristal Tapınak',
    worldName: 'Crystal Pattern Temple',
    colors: {
      primary: '#A855F7',
      secondary: '#581C87',
      accent: '#E879F9',
      background: '#2E1065',
      surface: '#4A044E',
      glow: 'rgba(168, 85, 247, 0.6)',
    },
    particles: { type: 'spores', count: 18, color: '#E879F9' },
    audio: { profile: 'magical' },
    animations: { personality: 'soft' },
    typography: { titleFont: 'System', letterSpacing: 2, textCase: 'none' },
    intro: { icon: '🔮', description: 'Sihirli kristal desenleri keşfet ve hafızana al!' },
    mascotId: 'memory_fox',
    ambientMotion: 'gentle',
    lightingTone: 'cool',
  },
  visual_hunt: {
    id: 'visual_hunt' as any,
    title: 'Kaşif Gözü',
    worldName: 'Explorer Vision Quest',
    colors: {
      primary: '#F59E0B',
      secondary: '#78350F',
      accent: '#FDE68A',
      background: '#1C0A00',
      surface: '#451A03',
      glow: 'rgba(245, 158, 11, 0.5)',
    },
    particles: { type: 'spores', count: 12, color: '#FDE68A' },
    audio: { profile: 'energetic' },
    animations: { personality: 'sharp' },
    typography: { titleFont: 'System', letterSpacing: 1, textCase: 'none' },
    intro: { icon: '🔭', description: 'Gizli hazineleri bul, kaşif gözünü kullan!' },
    mascotId: 'explorer_bird',
    ambientMotion: 'wave',
    lightingTone: 'warm',
  },
  sequence_recall: {
    id: 'sequence_recall' as any,
    title: 'Yankı Yolu',
    worldName: 'Echo Path Journey',
    colors: {
      primary: '#06B6D4',
      secondary: '#164E63',
      accent: '#67E8F9',
      background: '#082F49',
      surface: '#0C4A6E',
      glow: 'rgba(6, 182, 212, 0.5)',
    },
    particles: { type: 'shield', count: 10, color: '#67E8F9' },
    audio: { profile: 'focused' },
    animations: { personality: 'steady' },
    typography: { titleFont: 'System', letterSpacing: 2, textCase: 'none' },
    intro: { icon: '🌊', description: 'Sihirli yankı yolunu takip et ve hafızana al!' },
    mascotId: 'lantern_owl',
    ambientMotion: 'wave',
    lightingTone: 'cool',
  },
  sound_memory: {
    id: 'sound_memory' as any,
    title: 'Melodi Ormanı',
    worldName: 'Melody Forest',
    colors: {
      primary: '#22C55E',
      secondary: '#14532D',
      accent: '#86EFAC',
      background: '#052E16',
      surface: '#14532D',
      glow: 'rgba(34, 197, 94, 0.4)',
    },
    particles: { type: 'spores', count: 14, color: '#86EFAC' },
    audio: { profile: 'magical' },
    animations: { personality: 'soft' },
    typography: { titleFont: 'System', letterSpacing: 1, textCase: 'none' },
    intro: { icon: '🎵', description: 'Ormanın büyülü melodilerini dinle ve tekrar et!' },
    mascotId: 'melody_whale',
    ambientMotion: 'gentle',
    lightingTone: 'warm',
  },
  logic_puzzle: {
    id: 'logic_puzzle' as any,
    title: 'Zihin Dövmeci',
    worldName: 'Mind Forge',
    colors: {
      primary: '#EF4444',
      secondary: '#7F1D1D',
      accent: '#FCA5A5',
      background: '#1C0A0A',
      surface: '#450A0A',
      glow: 'rgba(239, 68, 68, 0.4)',
    },
    particles: { type: 'lightning', count: 10, color: '#FCA5A5' },
    audio: { profile: 'focused' },
    animations: { personality: 'steady' },
    typography: { titleFont: 'System', letterSpacing: 2, textCase: 'none' },
    intro: { icon: '⚙️', description: 'Antik mekanizmaları çöz ve zihin ustası ol!' },
    mascotId: 'ancient_turtle',
    ambientMotion: 'static',
    lightingTone: 'warm',
  },
};

// Merge G6 identities into the main registry
Object.assign(GAME_IDENTITIES, G6_IDENTITIES);
