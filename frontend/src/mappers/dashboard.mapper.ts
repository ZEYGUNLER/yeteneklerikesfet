import type {
  DashboardInsight,
  ProgressPoint,
  SkillSummary,
} from '../types/dashboard.types';

const clampSkill = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, numeric));
};

export const mapSkillProfile = (response: any): SkillSummary => {
  const skills = response?.skills ?? response ?? {};
  return {
    memory: clampSkill(skills.memory),
    attention: clampSkill(skills.attention),
    logic: clampSkill(skills.logic),
    lastUpdated:
      response?.lastUpdated ??
      response?.updatedAt ??
      response?.createdAt ??
      new Date().toISOString(),
  };
};

export const mapProgress = (response: any): ProgressPoint[] => {
  if (!Array.isArray(response)) {
    return [];
  }
  return response.map((item) => ({
    date: String(item?.date ?? item?.createdAt ?? ''),
    memory: clampSkill(item?.memory),
    attention: clampSkill(item?.attention),
    logic: clampSkill(item?.logic),
  }));
};

export const mapInsight = (response: any): DashboardInsight => {
  const trend = response?.trend;
  const normalizedTrend: DashboardInsight['trend'] =
    trend === 'positive' || trend === 'warning' || trend === 'neutral'
      ? trend
      : 'neutral';

  return {
    message: response?.message ?? 'No insight available yet.',
    trend: normalizedTrend,
  };
};

