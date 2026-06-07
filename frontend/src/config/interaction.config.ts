export const interactionConfig = {
  // Global Safety Toggles
  enableHaptics: true,
  fallbackToTapOnWeb: true, // Graceful degradation for web users

  // Micro-Hold (Attention Game)
  hold: {
    minDurationMs: 300, // Short enough to not tire, long enough to be intentional
    maxDurationMs: 800, // Prevents endless holding
    forgivenessMarginMs: 50, // Slight leniency
  },

  // Forgiving Swipe (Reaction Game)
  swipe: {
    minDistance: 30, // Small movement required
    velocityThreshold: 0.2, // Very forgiving velocity
    angleToleranceDegrees: 45, // Wide cone for directional swipes (e.g., Up, Down, Left, Right)
  },

  // Safe Trace (Memory Game)
  trace: {
    magneticSnapRadius: 40, // Snap to the nearest tile if close enough
    slipProtectionMs: 200, // If finger slips out and back in quickly, don't break the path
  },
};
