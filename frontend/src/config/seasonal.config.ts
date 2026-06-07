export type SeasonId = 'winter_crystal' | 'spring_bloom' | 'summer_splash' | 'autumn_leaves' | 'none';

export interface SeasonalConfig {
  id: SeasonId;
  name: string;
  themeColor: string;
  particleOverride: 'spores' | 'lightning' | 'shield' | 'snow' | 'leaves' | 'bubbles';
  backgroundTint: string;
  // E.g. [startMonth, startDay, endMonth, endDay] - months are 0-indexed
  dateRange: [number, number, number, number];
}

export const SEASONAL_EVENTS: Record<SeasonId, SeasonalConfig> = {
  winter_crystal: {
    id: 'winter_crystal',
    name: 'Kış Kristalleri',
    themeColor: '#BAE6FD',
    particleOverride: 'snow',
    backgroundTint: 'rgba(224, 242, 254, 0.05)',
    dateRange: [11, 15, 1, 15], // Dec 15 to Feb 15
  },
  spring_bloom: {
    id: 'spring_bloom',
    name: 'Bahar Çiçekleri',
    themeColor: '#FBCFE8',
    particleOverride: 'spores',
    backgroundTint: 'rgba(251, 207, 232, 0.05)',
    dateRange: [2, 1, 4, 31], // March 1 to May 31
  },
  summer_splash: {
    id: 'summer_splash',
    name: 'Yaz Serinliği',
    themeColor: '#67E8F9',
    particleOverride: 'bubbles',
    backgroundTint: 'rgba(103, 232, 249, 0.05)',
    dateRange: [5, 1, 7, 31], // June 1 to Aug 31
  },
  autumn_leaves: {
    id: 'autumn_leaves',
    name: 'Sonbahar Esintisi',
    themeColor: '#FDBA74',
    particleOverride: 'leaves',
    backgroundTint: 'rgba(253, 186, 116, 0.05)',
    dateRange: [8, 1, 10, 30], // Sept 1 to Nov 30
  },
  none: {
    id: 'none',
    name: 'Klasik',
    themeColor: 'transparent',
    particleOverride: 'spores',
    backgroundTint: 'transparent',
    dateRange: [0, 0, 0, 0],
  },
};
