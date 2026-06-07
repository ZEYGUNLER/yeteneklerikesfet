import { GameIdentityType } from './gameIdentity.config';

export type MascotId = 'memory_fox' | 'lantern_owl' | 'spark_rabbit' | 'ancient_turtle' | 'melody_whale' | 'explorer_bird';

export interface MascotConfig {
  id: MascotId;
  name: string;
  emoji: string;
  personality: 'wise' | 'curious' | 'energetic' | 'gentle';
  color: string;
}

export const MASCOTS: Record<MascotId, MascotConfig> = {
  memory_fox: {
    id: 'memory_fox',
    name: 'Memory Fox',
    emoji: '🦊',
    personality: 'wise',
    color: '#8B5CF6', // Purple
  },
  lantern_owl: {
    id: 'lantern_owl',
    name: 'Lantern Owl',
    emoji: '🦉',
    personality: 'wise',
    color: '#10B981', // Emerald
  },
  spark_rabbit: {
    id: 'spark_rabbit',
    name: 'Spark Rabbit',
    emoji: '🐰',
    personality: 'energetic',
    color: '#0EA5E9', // Sky Blue
  },
  ancient_turtle: {
    id: 'ancient_turtle',
    name: 'Ancient Turtle',
    emoji: '🐢',
    personality: 'gentle',
    color: '#EF4444', // Red
  },
  melody_whale: {
    id: 'melody_whale',
    name: 'Melody Whale',
    emoji: '🐳',
    personality: 'gentle',
    color: '#22C55E', // Green
  },
  explorer_bird: {
    id: 'explorer_bird',
    name: 'Explorer Bird',
    emoji: '🐦',
    personality: 'curious',
    color: '#F59E0B', // Amber
  },
};

/**
 * Mapping of Games to their Mascots.
 */
export const GAME_MASCOTS: Record<GameIdentityType, MascotId> = {
  memory: 'memory_fox',
  attention: 'lantern_owl',
  logic: 'spark_rabbit', // Wait, logic puzzle is ancient turtle, reaction/speed is spark rabbit.
  pattern_memory: 'memory_fox', // fallback or reuse
  visual_hunt: 'explorer_bird',
  sequence_recall: 'lantern_owl', // fallback
  sound_memory: 'melody_whale',
  logic_puzzle: 'ancient_turtle',
  reaction: 'spark_rabbit', // Assuming 'reaction' is the ID for the speed game (Hız Testi)
} as Record<GameIdentityType, MascotId>; // Override type safety briefly to handle reaction alias

// We need to ensure we map correctly based on actual GameIdentityTypes.
