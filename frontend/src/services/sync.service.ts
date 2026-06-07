import { persist } from './storage';
import { gameService, EndGameSessionRequest } from './game.service';

const SYNC_KEY = '@pending_sync_sessions';

export interface PendingSession {
  payload: EndGameSessionRequest;
  timestamp: number;
}

export const syncService = {
  /**
   * Queue a failed session payload to AsyncStorage for later retry.
   */
  async queueSession(payload: EndGameSessionRequest) {
    try {
      const raw = await persist.get(SYNC_KEY);
      const queue: PendingSession[] = raw ? JSON.parse(raw) : [];

      // Avoid queueing duplicates
      if (queue.some(item => item.payload.sessionId === payload.sessionId)) {
        return;
      }

      queue.push({
        payload,
        timestamp: Date.now(),
      });

      await persist.set(SYNC_KEY, JSON.stringify(queue));
      console.log(`[SyncService] Queued session ${payload.sessionId} for offline sync.`);
    } catch (e) {
      console.error('[SyncService] Failed to queue offline session:', e);
    }
  },

  /**
   * Attempt to synchronize all pending sessions with the backend.
   */
  async syncPending() {
    try {
      const raw = await persist.get(SYNC_KEY);
      if (!raw) return;

      const queue: PendingSession[] = JSON.parse(raw);
      if (queue.length === 0) return;

      console.log(`[SyncService] Attempting to sync ${queue.length} pending sessions...`);
      const remaining: PendingSession[] = [];

      for (const item of queue) {
        try {
          await gameService.end(item.payload);
          console.log(`[SyncService] Successfully synced session ${item.payload.sessionId}.`);
        } catch (err) {
          console.warn(`[SyncService] Failed to sync session ${item.payload.sessionId}, keeping in queue.`, err);
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        await persist.set(SYNC_KEY, JSON.stringify(remaining));
      } else {
        await persist.remove(SYNC_KEY);
        console.log('[SyncService] All pending sessions synced successfully.');
      }
    } catch (e) {
      console.error('[SyncService] Error during pending sync:', e);
    }
  }
};
