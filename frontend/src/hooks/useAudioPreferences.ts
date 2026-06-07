import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  music: '@audio_music_enabled',
  voice: '@audio_voice_enabled',
  sfx: '@audio_sfx_enabled',
  volume: '@audio_master_volume'
};

export function useAudioPreferences() {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [voiceGuidanceEnabled, setVoiceGuidanceEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const m = await AsyncStorage.getItem(STORAGE_KEYS.music);
        const v = await AsyncStorage.getItem(STORAGE_KEYS.voice);
        const s = await AsyncStorage.getItem(STORAGE_KEYS.sfx);
        const vol = await AsyncStorage.getItem(STORAGE_KEYS.volume);

        if (m !== null) setMusicEnabled(m === 'true');
        if (v !== null) setVoiceGuidanceEnabled(v === 'true');
        if (s !== null) setSfxEnabled(s === 'true');
        if (vol !== null) setMasterVolume(parseFloat(vol));
      } catch (e) {
        console.warn('Failed to load audio preferences', e);
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, []);

  const updateMusic = async (val: boolean) => {
    setMusicEnabled(val);
    await AsyncStorage.setItem(STORAGE_KEYS.music, String(val));
  };

  const updateVoice = async (val: boolean) => {
    setVoiceGuidanceEnabled(val);
    await AsyncStorage.setItem(STORAGE_KEYS.voice, String(val));
  };

  const updateSfx = async (val: boolean) => {
    setSfxEnabled(val);
    await AsyncStorage.setItem(STORAGE_KEYS.sfx, String(val));
  };

  const updateVolume = async (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setMasterVolume(clamped);
    await AsyncStorage.setItem(STORAGE_KEYS.volume, String(clamped));
  };

  return {
    musicEnabled,
    voiceGuidanceEnabled,
    sfxEnabled,
    masterVolume,
    loading,
    updateMusic,
    updateVoice,
    updateSfx,
    updateVolume
  };
}
