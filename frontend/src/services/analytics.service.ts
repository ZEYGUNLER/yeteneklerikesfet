import { create } from 'axios';

const analyticsApi = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 10000,
});

export const analyticsService = {
  getSkillProfile(childId: string) {
    return analyticsApi.get(`/analytics/skill-profile/${childId}`);
  },
  getProgress(childId: string) {
    return analyticsApi.get(`/analytics/progress/${childId}`);
  },
  getInsight(childId: string) {
    return analyticsApi.get(`/analytics/dashboard/${childId}`);
  },
};

