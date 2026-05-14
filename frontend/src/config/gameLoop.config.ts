/**
 * Centralized configuration for Game Loop rhythm and pacing.
 * Manages combo thresholds, reward timings, and emotional difficulty curves.
 */

export const GAME_LOOP_CONFIG = {
  // Combo Logic (Streaks)
  combos: {
    thresholds: {
      super: 3,     // "Süper!"
      mega: 7,      // "Harika!"
      ultra: 12,    // "Mükemmel!"
      master: 20,   // "Efsanevi!"
    },
    resetOnFail: true,
    momentumDecay: 2000, // ms before momentum starts to drop
  },

  // Reward Pacing (ms)
  rewards: {
    celebrationDuration: 1500,
    perfectRoundDelay: 400,
    introCountdown: 3000, // Total intro time
  },

  // Pacing & Difficulty Curves (Emotional Perception)
  pacing: {
    minSequenceGap: 300,  // ms between tiles/targets at max intensity
    maxSequenceGap: 800,  // ms at start
    accelerationFactor: 0.05, // How much faster it feels per streak
  },

  // Fail Recovery (Soft-Fail)
  recovery: {
    softFailDuration: 1200, // Time for motivational pause
    autoRetry: true,
  },

  // Mastery Feedback
  mastery: {
    perfectAccuracyBonus: 1.2, // Visual multiplier for score/feedback
    hesitationLimit: 800,      // Max ms before it's not "Perfect/Fast"
  },
};
