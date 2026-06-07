import { Unlockable, Achievement } from '../types/progression.types';

export const UNLOCKABLES: Unlockable[] = [
  {
    id: 'avatar_star_explorer',
    name: 'Yıldız Gezgini',
    type: 'avatar',
    rarity: 'common',
    requirement: { level: 2 },
  },
  {
    id: 'theme_neon_dream',
    name: 'Neon Rüyası',
    type: 'theme',
    rarity: 'rare',
    requirement: { level: 5 },
  },
  {
    id: 'effect_sparkles',
    name: 'Sihirli Parıltılar',
    type: 'particle',
    rarity: 'epic',
    requirement: { level: 10 },
  },
  {
    id: 'border_golden_focus',
    name: 'Altın Odak Çerçevesi',
    type: 'border',
    rarity: 'legendary',
    requirement: { achievementId: 'focus_guardian_1' },
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'memory_master_1',
    name: 'Hafıza Ustası',
    description: 'Hafıza oyununda hiç hata yapmadan bitir.',
    icon: 'brain',
    category: 'mastery',
  },
  {
    id: 'focus_guardian_1',
    name: 'Odak Muhafızı',
    description: 'Dikkat oyununda 3 dakika boyunca odağını koru.',
    icon: 'eye',
    category: 'focus',
  },
  {
    id: 'streak_explorer_3',
    name: 'İstikrar Yolcusu',
    description: '3 gün üst üste oyna.',
    icon: 'calendar',
    category: 'consistency',
  },
  {
    id: 'speed_champion_1',
    name: 'Hız Şampiyonu',
    description: 'Reaksiyon oyununda rekor kır.',
    icon: 'zap',
    category: 'speed',
  },
];
