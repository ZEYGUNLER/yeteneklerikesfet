export type SkillSummary = {
  memory: number;
  attention: number;
  logic: number;
  lastUpdated: string;
};

export type ProgressPoint = {
  date: string;
  memory: number;
  attention: number;
  logic: number;
};

export type DashboardInsight = {
  message: string;
  trend: 'positive' | 'warning' | 'neutral';
};

export type DashboardViewModel = {
  summary: SkillSummary;
  progress: ProgressPoint[];
  insight: DashboardInsight;
};

