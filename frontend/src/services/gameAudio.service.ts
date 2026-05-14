import { Audio } from 'expo-av';
import { GAME_FEEL_CONFIG } from '@/config/gameFeel.config';

/**
 * Centralized Audio Service for Game Feel.
 * Implements throttling to prevent sound spam and ensures proper cleanup.
 */
class GameAudioService {
  private lastTriggerTime: number = 0;
  private sounds: Record<string, Audio.Sound> = {};

  /**
   * Preload critical game sounds to avoid latency.
   */
  async loadSounds() {
    try {
      // Logic for loading assets (e.g., success.mp3, error.mp3)
      // This is a placeholder until specific assets are mapped.
      if (GAME_FEEL_CONFIG.debug.enableGameplayDebug) {
        console.log('[GameAudio] Loading sounds...');
      }
    } catch (error) {
      console.warn('[GameAudio] Failed to load sounds:', error);
    }
  }

  /**
   * Play a sound effect with built-in spam protection.
   */
  async playEffect(type: 'success' | 'fail' | 'click' | 'reward', profile: string = 'magical') {
    const now = Date.now();
    if (now - this.lastTriggerTime < GAME_FEEL_CONFIG.audio.throttleDelay) {
      return; // Skip to avoid auditory clutter
    }

    this.lastTriggerTime = now;

    try {
      // Identity-aware sound selection
      // Different profiles (magical, energetic, focused) will eventually map to different sound assets
      if (GAME_FEEL_CONFIG.debug.enableGameplayDebug) {
        console.log(`[GameAudio] Playing ${type} effect with ${profile} profile`);
      }
      
      // Example mapping logic:
      // const asset = this.getAsset(type, profile);
      // await this.sounds[asset].replayAsync();
    } catch (error) {
      // Silent fail to not disrupt gameplay
    }
  }

  /**
   * Cleanup all sound resources to prevent memory leaks.
   */
  async cleanup() {
    for (const sound of Object.values(this.sounds)) {
      try {
        await sound.unloadAsync();
      } catch (e) {}
    }
    this.sounds = {};
  }
}

export const gameAudioService = new GameAudioService();
