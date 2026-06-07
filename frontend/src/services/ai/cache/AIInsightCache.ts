import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIInsight } from '../providers/AIProvider';

interface CacheEntry {
  insight: AIInsight;
  timestamp: number;
  profileHash: string;
}

export class AIInsightCache {
  private static CACHE_PREFIX = '@ai_insight_';
  private static TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private static generateHash(childId: string, contextObj: any): string {
    const str = JSON.stringify(contextObj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${childId}_${hash}`;
  }

  public static async get(childId: string, contextObj: any): Promise<AIInsight | null> {
    try {
      const key = `${this.CACHE_PREFIX}${childId}`;
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      const now = Date.now();

      // Check TTL
      if (now - entry.timestamp > this.TTL_MS) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      // Check Hash (Invalidate if context has changed significantly)
      const currentHash = this.generateHash(childId, contextObj);
      if (entry.profileHash !== currentHash) {
        return null;
      }

      return entry.insight;
    } catch (e) {
      return null;
    }
  }

  public static async set(childId: string, contextObj: any, insight: AIInsight): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}${childId}`;
      const entry: CacheEntry = {
        insight,
        timestamp: Date.now(),
        profileHash: this.generateHash(childId, contextObj)
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      // Fail silently, cache is not critical
    }
  }
}
