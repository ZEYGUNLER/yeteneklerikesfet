import { SEASONAL_EVENTS, SeasonId, SeasonalConfig } from '@/config/seasonal.config';

/**
 * PHASE G8B — Seasonal Event Engine
 * 
 * Manages lightweight, cozy world events. 
 * NEVER introduces time anxiety or limited-time pressure mechanics.
 * Purely for atmospheric discovery.
 */
class SeasonalEngine {
  /**
   * Determines if a season is currently active based on the date.
   */
  private isSeasonActive(dateRange: [number, number, number, number], currentDate: Date): boolean {
    const [startMonth, startDay, endMonth, endDay] = dateRange;
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // Handle year wrap (e.g., Dec to Feb)
    if (startMonth > endMonth) {
      if (currentMonth > startMonth || (currentMonth === startMonth && currentDay >= startDay)) return true;
      if (currentMonth < endMonth || (currentMonth === endMonth && currentDay <= endDay)) return true;
      return false;
    }

    // Normal range (e.g., March to May)
    if (currentMonth > startMonth && currentMonth < endMonth) return true;
    if (currentMonth === startMonth && currentMonth === endMonth) {
      return currentDay >= startDay && currentDay <= endDay;
    }
    if (currentMonth === startMonth && currentDay >= startDay) return true;
    if (currentMonth === endMonth && currentDay <= endDay) return true;

    return false;
  }

  /**
   * Returns the currently active season config, or 'none' if no event is active.
   */
  getActiveSeason(): SeasonalConfig {
    const now = new Date();
    
    for (const [id, config] of Object.entries(SEASONAL_EVENTS)) {
      if (id === 'none') continue;
      
      if (this.isSeasonActive(config.dateRange, now)) {
        return config;
      }
    }
    
    return SEASONAL_EVENTS['none'];
  }
}

export const seasonalEngine = new SeasonalEngine();
