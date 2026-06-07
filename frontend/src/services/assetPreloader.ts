/**
 * ASSET PRELOADER SERVICE — Phase G6
 * Manages lazy loading and caching of game assets.
 * Prevents world transition lag for audio-heavy / asset-heavy games.
 */

import { getAllGames, getUnlockedGames } from '../config/gameBlueprint';

type PreloadStatus = 'idle' | 'loading' | 'ready' | 'error';

const assetCache = new Map<string, PreloadStatus>();

/**
 * Mark a game's assets as preloaded.
 * Real asset loading (audio buffers, images) would be added here.
 */
export async function preloadGameAssets(gameId: string): Promise<void> {
  if (assetCache.get(gameId) === 'ready') return;

  assetCache.set(gameId, 'loading');
  try {
    // TODO: When real audio assets are added, load them here
    // e.g., await Audio.Sound.createAsync(require('../assets/sounds/melody_forest/tone1.mp3'))
    await new Promise<void>((resolve) => setTimeout(resolve, 50)); // simulate minimal init
    assetCache.set(gameId, 'ready');
  } catch {
    assetCache.set(gameId, 'error');
  }
}

/**
 * Preload assets for currently unlocked games only.
 * Called when the World Map mounts.
 */
export async function preloadUnlockedGames(): Promise<void> {
  const unlocked = getUnlockedGames();
  await Promise.all(unlocked.map((game) => preloadGameAssets(game.id)));
}

/**
 * Preload a specific game and its "adjacent" games on the map.
 * Keeps distant worlds unloaded to save memory.
 */
export async function preloadNearbyGames(currentGameId: string): Promise<void> {
  const all = getAllGames();
  const currentIndex = all.findIndex((g) => g.id === currentGameId);
  const nearby = all.slice(
    Math.max(0, currentIndex - 1),
    Math.min(all.length, currentIndex + 2),
  );
  await Promise.all(nearby.map((game) => preloadGameAssets(game.id)));
}

export function getAssetStatus(gameId: string): PreloadStatus {
  return assetCache.get(gameId) ?? 'idle';
}

export function isGameReady(gameId: string): boolean {
  return assetCache.get(gameId) === 'ready';
}
