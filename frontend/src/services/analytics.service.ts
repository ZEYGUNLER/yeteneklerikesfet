import { api } from './api';

export const analyticsService = {
  getSkillProfile(childId: string) {
    return api.get(`/analytics/skill-profile/${childId}`);
  },
  getProgress(childId: string) {
    return api.get(`/analytics/progress/${childId}`);
  },
  getInsight(childId: string) {
    return api.get(`/analytics/dashboard/${childId}`);
  },
};

