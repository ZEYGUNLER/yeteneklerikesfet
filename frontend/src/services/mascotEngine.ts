import { immersionSafetyRules } from './immersionSafetyRules';
import { adaptiveEngine } from './adaptiveEngine';

export type MascotState = 'idle' | 'celebrate' | 'support' | 'curious' | 'hidden';

export interface MascotMessage {
  text: string;
  durationMs: number;
}

/**
 * PHASE G8A — Mascot Engine
 *
 * Emotional companion character logic.
 * NEVER competes with gameplay.
 */
class MascotEngine {
  private currentState: MascotState = 'hidden';
  private currentMessage: MascotMessage | null = null;
  private listeners: Set<(state: MascotState, message: MascotMessage | null) => void> = new Set();

  subscribe(listener: (state: MascotState, message: MascotMessage | null) => void) {
    this.listeners.add(listener);
    // Initial sync
    listener(this.currentState, this.currentMessage);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentState, this.currentMessage));
  }

  /**
   * Safe trigger. Will be ignored if immersion mode is 'minimal' and action is too noisy.
   */
  triggerState(state: MascotState, messageText?: string, durationMs: number = 3000) {
    const safety = immersionSafetyRules.getSafeConfig();
    
    // Safety Layer: If mascot is disabled or reduced, we skip certain states or messages
    if (!safety.mascotEnabled) {
      this.hide();
      return;
    }

    if (safety.immersionLevel === 'minimal' && state !== 'support') {
      // In minimal mode, only show support to avoid distraction.
      // E.g., don't show flashy 'celebrate' when tired.
      return;
    }

    this.currentState = state;
    this.currentMessage = messageText ? { text: messageText, durationMs } : null;
    this.notify();

    if (this.currentMessage) {
      setTimeout(() => {
        if (this.currentMessage?.text === messageText) {
          this.currentMessage = null;
          this.currentState = 'idle';
          this.notify();
        }
      }, durationMs);
    }
  }

  hide() {
    this.currentState = 'hidden';
    this.currentMessage = null;
    this.notify();
  }

  reset() {
    this.hide();
  }
}

export const mascotEngine = new MascotEngine();
