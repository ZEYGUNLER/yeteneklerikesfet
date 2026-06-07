import { adaptiveEngine } from './adaptiveEngine';

export type ImmersionLevel = 'full' | 'reduced' | 'minimal';

export interface ImmersionSafetyConfig {
  immersionLevel: ImmersionLevel;
  maxParticles: number;
  mascotEnabled: boolean;
  ambientAudioVolume: number; // 0.0 to 1.0
  transitionDurationMs: number;
}

/**
 * PHASE G8A — Immersion Safety Layer
 *
 * Rules:
 * - Low Motion Mode Support
 * - Emotional Safety Over Engagement
 * - Immersion MUST NEVER COMPETE WITH GAMEPLAY
 */
export const immersionSafetyRules = {
  /**
   * Determine the current safe immersion config based on child fatigue
   * and generic device constraints (mocked via performance API if available).
   */
  getSafeConfig(): ImmersionSafetyConfig {
    const scores = adaptiveEngine.getScores();
    const fatigue = scores.fatigueIndex; // 0.0 to 1.0
    const frustration = scores.frustrationLevel;

    // TODO: Connect to an actual device settings/battery/FPS monitor later.
    // For now, we lean entirely on the emotional safety metric.
    
    let level: ImmersionLevel = 'full';

    // If fatigue or frustration is very high, strictly reduce motion.
    if (fatigue >= 0.8 || frustration >= 0.8) {
      level = 'minimal';
    } else if (fatigue >= 0.5 || frustration >= 0.5) {
      level = 'reduced';
    }

    switch (level) {
      case 'minimal':
        return {
          immersionLevel: 'minimal',
          maxParticles: 0,              // No particles to reduce sensory load
          mascotEnabled: true,          // Mascot remains for emotional support but shouldn't animate aggressively
          ambientAudioVolume: 0.1,      // Very soft background
          transitionDurationMs: 300,    // Quick, unblocking transitions
        };
      case 'reduced':
        return {
          immersionLevel: 'reduced',
          maxParticles: 5,              // Halved particles
          mascotEnabled: true,
          ambientAudioVolume: 0.25,     // Moderate background
          transitionDurationMs: 600,
        };
      case 'full':
      default:
        return {
          immersionLevel: 'full',
          maxParticles: 20,             // Normal limit (per gameIdentity)
          mascotEnabled: true,
          ambientAudioVolume: 0.4,      // Safe comfortable max
          transitionDurationMs: 1000,   // Full cinematic transition
        };
    }
  },

  /**
   * Helper to clamp the requested particles against the safe maximum.
   */
  getSafeParticleCount(requestedCount: number): number {
    const { maxParticles } = this.getSafeConfig();
    return Math.min(requestedCount, maxParticles);
  }
};
