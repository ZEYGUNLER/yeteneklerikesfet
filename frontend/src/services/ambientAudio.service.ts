import { Audio } from 'expo-av';
import { immersionSafetyRules } from './immersionSafetyRules';

export type AmbientTrackProfile = 'magical' | 'focused' | 'energetic' | 'calm';

/**
 * PHASE G8A — Ambient Audio Service
 *
 * Manages soft, looping background soundscapes.
 * Incorporates emotional safety by strictly limiting volume and enabling cross-fades.
 */
class AmbientAudioService {
  private currentTrack: Audio.Sound | null = null;
  private currentProfile: AmbientTrackProfile | null = null;
  private isMuted: boolean = false;

  /**
   * Mock tracks - normally these would be require('./assets/...')
   */
  private trackMap: Record<AmbientTrackProfile, any> = {
    magical: null,
    focused: null,
    energetic: null,
    calm: null,
  };

  /**
   * Cross-fade to a new ambient profile.
   * Checks immersion rules to ensure volume isn't overwhelming.
   */
  async playAmbient(profile: AmbientTrackProfile) {
    if (this.currentProfile === profile || this.isMuted) return;

    const safety = immersionSafetyRules.getSafeConfig();
    const targetVolume = safety.ambientAudioVolume;

    try {
      // 1. Fade out current track if it exists
      if (this.currentTrack) {
        await this.currentTrack.setVolumeAsync(0); // Mock fade out
        await this.currentTrack.stopAsync();
        await this.currentTrack.unloadAsync();
        this.currentTrack = null;
      }

      this.currentProfile = profile;

      // 2. Load and play new track
      // const asset = this.trackMap[profile];
      // if (asset) {
      //   const { sound } = await Audio.Sound.createAsync(asset, {
      //     isLooping: true,
      //     volume: 0, // start at 0 for fade in
      //   });
      //   this.currentTrack = sound;
      //   await sound.playAsync();
      //   await sound.setVolumeAsync(targetVolume); // Mock fade in
      // }
      
      console.log(`[AmbientAudio] Playing ${profile} track at volume ${targetVolume}`);
    } catch (error) {
      console.warn('[AmbientAudio] Failed to play ambient track:', error);
    }
  }

  /**
   * Updates volume dynamically if fatigue increases during a session.
   */
  async updateVolumeForSafety() {
    if (!this.currentTrack || this.isMuted) return;
    
    const safety = immersionSafetyRules.getSafeConfig();
    try {
      await this.currentTrack.setVolumeAsync(safety.ambientAudioVolume);
    } catch (e) {
      // ignore
    }
  }

  async stop() {
    if (this.currentTrack) {
      try {
        await this.currentTrack.stopAsync();
        await this.currentTrack.unloadAsync();
      } catch (e) {}
      this.currentTrack = null;
      this.currentProfile = null;
    }
  }

  mute() {
    this.isMuted = true;
    this.stop();
  }

  unmute() {
    this.isMuted = false;
  }
}

export const ambientAudioService = new AmbientAudioService();
