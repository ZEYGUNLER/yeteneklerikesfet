export interface PlanningTelemetry {
  version: number;              // Protocol version (e.g., 1)
  routeEfficiency: number;      // 0-1, actual path vs optimal path
  optimalPathRatio: number;     // 0-1, proportion of optimal moves
  replanningQuality: number;    // 0-1, recovery success rate after a dead-end
  planningTimeMs: number;       // time spent before first move
  deadEnds: number;             // number of wrong paths taken
  hints: number;                // number of hints used
  completionRate: number;       // 0-1, objective completion
}
