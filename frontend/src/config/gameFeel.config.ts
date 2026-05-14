/**
 * Centralized configuration for Game Feel tuning.
 * All animation durations, feedback cooldowns, and sensory safety 
 * parameters must be defined here to ensure consistency and easier balancing.
 */
export const GAME_FEEL_CONFIG = {
  // Animation Durations (ms)
  durations: {
    pop: 150,
    bounce: 300,
    shake: 400,
    fade: 200,
    progressBar: 400,
    feedbackText: 1200, // Duration the praise stays on screen
  },

  // Animation Scales/Intensities
  intensities: {
    pressScale: 0.94,
    popScale: 1.15,
    shakeDistance: 8,
    starGrowth: 1.4,
  },

  // Feedback & Throttling
  praise: {
    cooldown: 1800, // Prevent overlapping praise messages
    streakThreshold: 3, // Minimum streak for "Super!" level feedback
    perfectThreshold: 10, // Minimum streak for "Mükemmel!" level feedback
    fastThreshold: 1200, // ms for "Çok Hızlı!" feedback
  },

  // Audio Tuning
  audio: {
    masterVolume: 0.8,
    throttleDelay: 100, // Minimum gap between sound triggers
  },

  // Sensory Safety
  safety: {
    maxParticles: 30,
    disableFlash: false,
    gentleVibration: true,
  },

  // Observation Mode
  debug: {
    enableGameplayDebug: false,
    logMetrics: true,
  }
};
