/**
 * GAME BLUEPRINT SYSTEM — Phase G6
 * The central contract for every game on the platform.
 * Defines identity, capabilities, cognitive taxonomy, lifecycle state, and atmosphere.
 * 
 * This is the scientific backbone that powers:
 *   - Analytics & parent insights
 *   - Adaptive difficulty (future)
 *   - AI personalization (future)
 *   - World map progression
 *   - Asset preloading strategy
 */

import type { GameIdentityType } from './gameIdentity.config';

// ─── Cognitive Taxonomy ────────────────────────────────────────────────────────
export type CognitiveDomain =
  | 'working_memory'
  | 'processing_speed'
  | 'visual_attention'
  | 'auditory_memory'
  | 'pattern_recognition'
  | 'logic_reasoning'
  | 'impulse_control'
  | 'spatial_reasoning';

// ─── Capability System ─────────────────────────────────────────────────────────
export interface GameCapabilities {
  supportsAudio: boolean;
  supportsGestures: boolean;
  supportsCombo: boolean;
  supportsMetaProgression: boolean;
  supportsAdaptiveDifficulty: boolean;
  supportsMultiplayer: boolean; // future-proofing
}

// ─── Lifecycle States ──────────────────────────────────────────────────────────
export interface GameLifecycleStatus {
  unlocked: boolean;
  completed: boolean;
  masteryLevel: number; // 0 = none, 1 = bronze, 2 = silver, 3 = gold
  discovered: boolean;  // false = triggers Discovery Cinematic on first visit
}

// ─── Atmosphere Config ─────────────────────────────────────────────────────────
export interface GameAtmosphere {
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  ambientSoundProfile: 'magical' | 'energetic' | 'focused' | 'calm' | 'mysterious';
  particleStyle: 'spores' | 'lightning' | 'shield' | 'crystals' | 'leaves' | 'embers' | 'none';
  backgroundStyle: 'gradient' | 'stars' | 'forest' | 'crystal' | 'forge' | 'ocean';
  transitionStyle: 'fade' | 'slide' | 'zoom' | 'dissolve';
}

// ─── Metrics Config ────────────────────────────────────────────────────────────
export interface GameMetricsConfig {
  tracksSpeed: boolean;
  tracksAccuracy: boolean;
  tracksHesitation: boolean;
  tracksCombo: boolean;
  primaryMetricLabel: string; // e.g. "Accuracy", "Speed", "Pattern Score"
}

// ─── Full Blueprint ────────────────────────────────────────────────────────────
export interface GameBlueprint {
  id: string;
  identity: GameIdentityType;
  routeName: string; // the expo-router path segment
  cognitiveDomains: CognitiveDomain[];
  capabilities: GameCapabilities;
  status: GameLifecycleStatus;
  atmosphere: GameAtmosphere;
  achievements: string[];
  metricsConfig: GameMetricsConfig;
  // Future expansion hooks
  seasonalTag?: string;
  isEventWorld?: boolean;
  isLimitedTime?: boolean;
}

// ─── Default Capability Presets ────────────────────────────────────────────────
const BASE_CAPABILITIES: GameCapabilities = {
  supportsAudio: false,
  supportsGestures: true,
  supportsCombo: true,
  supportsMetaProgression: true,
  supportsAdaptiveDifficulty: true, // Phase G7: all games now support adaptive difficulty
  supportsMultiplayer: false,
};

// ─── Game Blueprints Registry ──────────────────────────────────────────────────
export const GAME_BLUEPRINTS: Record<string, GameBlueprint> = {

  memory: {
    id: 'memory',
    identity: 'memory',
    routeName: 'memory',
    cognitiveDomains: ['logic_reasoning', 'spatial_reasoning'],
    capabilities: { ...BASE_CAPABILITIES },
    status: { unlocked: true, completed: false, masteryLevel: 0, discovered: true },
    atmosphere: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#4C1D95',
      glowColor: 'rgba(139, 92, 246, 0.5)',
      ambientSoundProfile: 'focused',
      particleStyle: 'leaves',
      backgroundStyle: 'forest',
      transitionStyle: 'fade',
    },
    achievements: ['Planlama Ustası', 'Harita Kaşifi', 'Strateji Dehası'],
    metricsConfig: {
      tracksSpeed: true,
      tracksAccuracy: true,
      tracksHesitation: true,
      tracksCombo: false,
      primaryMetricLabel: 'Planlama Skoru',
    },
  },

  attention: {
    id: 'attention',
    identity: 'attention',
    routeName: 'attention',
    cognitiveDomains: ['impulse_control', 'visual_attention', 'processing_speed'],
    capabilities: { ...BASE_CAPABILITIES },
    status: { unlocked: true, completed: false, masteryLevel: 0, discovered: true },
    atmosphere: {
      primaryColor: '#10B981',
      secondaryColor: '#064E3B',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      ambientSoundProfile: 'focused',
      particleStyle: 'shield',
      backgroundStyle: 'gradient',
      transitionStyle: 'slide',
    },
    achievements: ['Dikkat Koruyucusu', 'İmpuls Kontrolü', 'Odak Şampiyonu'],
    metricsConfig: {
      tracksSpeed: true,
      tracksAccuracy: true,
      tracksHesitation: false,
      tracksCombo: false,
      primaryMetricLabel: 'Dikkat Skoru',
    },
  },

  reaction: {
    id: 'reaction',
    identity: 'reaction', // reuses 'logic' identity theme (energetic blue)
    routeName: 'reaction',
    cognitiveDomains: ['processing_speed', 'visual_attention'],
    capabilities: { ...BASE_CAPABILITIES },
    status: { unlocked: true, completed: false, masteryLevel: 0, discovered: true },
    atmosphere: {
      primaryColor: '#0EA5E9',
      secondaryColor: '#082F49',
      glowColor: 'rgba(14, 165, 233, 0.4)',
      ambientSoundProfile: 'energetic',
      particleStyle: 'lightning',
      backgroundStyle: 'stars',
      transitionStyle: 'zoom',
    },
    achievements: ['Hız Şampiyonu', 'Işık Hızı', 'Reaksiyon Ustası'],
    metricsConfig: {
      tracksSpeed: true,
      tracksAccuracy: false,
      tracksHesitation: false,
      tracksCombo: false,
      primaryMetricLabel: 'Reaksiyon Süresi',
    },
  },

  // ─── NEW WORLDS (Phase G6) ─────────────────────────────────────────────────

  pattern_memory: {
    id: 'pattern_memory',
    identity: 'pattern_memory',
    routeName: 'pattern-memory',
    cognitiveDomains: ['pattern_recognition', 'working_memory', 'spatial_reasoning'],
    capabilities: { ...BASE_CAPABILITIES, supportsAdaptiveDifficulty: true },
    status: { unlocked: true, completed: false, masteryLevel: 0, discovered: true },
    atmosphere: {
      primaryColor: '#A855F7',
      secondaryColor: '#581C87',
      glowColor: 'rgba(168, 85, 247, 0.6)',
      ambientSoundProfile: 'mysterious',
      particleStyle: 'crystals',
      backgroundStyle: 'crystal',
      transitionStyle: 'dissolve',
    },
    achievements: ['Desen Bilgesi', 'Kristal Ustası', 'Ayna Şampiyonu'],
    metricsConfig: {
      tracksSpeed: true,
      tracksAccuracy: true,
      tracksHesitation: true,
      tracksCombo: true,
      primaryMetricLabel: 'Desen Skoru',
    },
  },

  visual_hunt: {
    id: 'visual_hunt',
    identity: 'visual_hunt',
    routeName: 'visual-hunt',
    cognitiveDomains: ['visual_attention', 'processing_speed'],
    capabilities: { ...BASE_CAPABILITIES, supportsAdaptiveDifficulty: true },
    status: { unlocked: false, completed: false, masteryLevel: 0, discovered: false },
    atmosphere: {
      primaryColor: '#F59E0B',
      secondaryColor: '#78350F',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      ambientSoundProfile: 'energetic',
      particleStyle: 'leaves',
      backgroundStyle: 'forest',
      transitionStyle: 'zoom',
    },
    achievements: ['Kartal Gözü', 'Hazine Avcısı', 'Keşif Kahramanı'],
    metricsConfig: {
      tracksSpeed: true,
      tracksAccuracy: true,
      tracksHesitation: false,
      tracksCombo: false,
      primaryMetricLabel: 'Keşif Skoru',
    },
  },

  sequence_recall: {
    id: 'sequence_recall',
    identity: 'sequence_recall',
    routeName: 'sequence-recall',
    cognitiveDomains: ['working_memory', 'processing_speed'],
    capabilities: { ...BASE_CAPABILITIES },
    status: { unlocked: false, completed: false, masteryLevel: 0, discovered: false },
    atmosphere: {
      primaryColor: '#06B6D4',
      secondaryColor: '#164E63',
      glowColor: 'rgba(6, 182, 212, 0.5)',
      ambientSoundProfile: 'calm',
      particleStyle: 'none',
      backgroundStyle: 'ocean',
      transitionStyle: 'slide',
    },
    achievements: ['Yankı Ustası', 'Yol Koruyucusu', 'Sıra Şampiyonu'],
    metricsConfig: {
      tracksSpeed: false,
      tracksAccuracy: true,
      tracksHesitation: true,
      tracksCombo: false,
      primaryMetricLabel: 'Anı Skoru',
    },
  },

  sound_memory: {
    id: 'sound_memory',
    identity: 'sound_memory',
    routeName: 'sound-memory',
    cognitiveDomains: ['auditory_memory', 'pattern_recognition'],
    capabilities: {
      ...BASE_CAPABILITIES,
      supportsAudio: true,
      supportsGestures: false, // tap-only, audio-first
    },
    status: { unlocked: false, completed: false, masteryLevel: 0, discovered: false },
    atmosphere: {
      primaryColor: '#22C55E',
      secondaryColor: '#14532D',
      glowColor: 'rgba(34, 197, 94, 0.4)',
      ambientSoundProfile: 'calm',
      particleStyle: 'leaves',
      backgroundStyle: 'forest',
      transitionStyle: 'fade',
    },
    achievements: ['Melodi Ustası', 'Orman Dinleyicisi', 'Ritim Kahramanı'],
    metricsConfig: {
      tracksSpeed: false,
      tracksAccuracy: true,
      tracksHesitation: true,
      tracksCombo: false,
      primaryMetricLabel: 'Melodi Skoru',
    },
  },

  logic_puzzle: {
    id: 'logic_puzzle',
    identity: 'logic_puzzle',
    routeName: 'logic-puzzle',
    cognitiveDomains: ['logic_reasoning', 'pattern_recognition', 'spatial_reasoning'],
    capabilities: {
      ...BASE_CAPABILITIES,
      supportsCombo: false,
      supportsAdaptiveDifficulty: true,
    },
    status: { unlocked: false, completed: false, masteryLevel: 0, discovered: false },
    atmosphere: {
      primaryColor: '#EF4444',
      secondaryColor: '#7F1D1D',
      glowColor: 'rgba(239, 68, 68, 0.4)',
      ambientSoundProfile: 'focused',
      particleStyle: 'embers',
      backgroundStyle: 'forge',
      transitionStyle: 'dissolve',
    },
    achievements: ['Zihin Mimarı', 'Mantık Bilgesi', 'Bulmaca Ustası'],
    metricsConfig: {
      tracksSpeed: false,
      tracksAccuracy: true,
      tracksHesitation: true,
      tracksCombo: false,
      primaryMetricLabel: 'Çözüm Skoru',
    },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

export const getBlueprintById = (id: string): GameBlueprint | undefined =>
  GAME_BLUEPRINTS[id];

export const getUnlockedGames = (): GameBlueprint[] =>
  Object.values(GAME_BLUEPRINTS).filter((g) => g.status.unlocked);

export const getUndiscoveredGames = (): GameBlueprint[] =>
  Object.values(GAME_BLUEPRINTS).filter((g) => g.status.unlocked && !g.status.discovered);

export const getAllGames = (): GameBlueprint[] =>
  Object.values(GAME_BLUEPRINTS);

// ─── Future World Expansion Hooks ─────────────────────────────────────────────
// Reserved for future seasonal/event worlds. Do not remove.
export const SEASONAL_WORLDS: GameBlueprint[] = [];
export const EVENT_WORLDS: GameBlueprint[] = [];
export const LIMITED_TIME_WORLDS: GameBlueprint[] = [];
