import { useQuery } from '@tanstack/react-query';
import {
  mapInsight,
  mapProgress,
  mapSkillProfile,
} from '../mappers/dashboard.mapper';
import { analyticsService } from '../services/analytics.service';
import type {
  DashboardInsight,
  ProgressPoint,
  SkillSummary,
} from '../types/dashboard.types';

type UseDashboardResult = {
  summary: SkillSummary | null;
  progress: ProgressPoint[];
  insight: DashboardInsight | null;
  loading: boolean;
  error: string | null;
};

export const useDashboard = (childId: string): UseDashboardResult => {
  const query = useQuery({
    queryKey: ['dashboard', childId],
    enabled: Boolean(childId),
    queryFn: async () => {
      const [skillResponse, progressResponse, insightResponse] = await Promise.all(
        [
          analyticsService.getSkillProfile(childId),
          analyticsService.getProgress(childId),
          analyticsService.getInsight(childId),
        ],
      );

      return {
        summary: mapSkillProfile(skillResponse.data),
        progress: mapProgress(progressResponse.data),
        insight: mapInsight(insightResponse.data),
      };
    },
  });

  return {
    summary: query.data?.summary ?? null,
    progress: query.data?.progress ?? [],
    insight: query.data?.insight ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
};

