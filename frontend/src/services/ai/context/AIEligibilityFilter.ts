import { CognitiveProfile } from '../../cognitiveScoringEngine';
import { LongitudinalReport } from '../../longitudinalAnalysisEngine';
import { AdaptiveRecommendationReport } from '../../adaptiveRecommendationEngine';

export class AIEligibilityFilter {
  /**
   * Strictly removes any domain data that is marked as aiEligibility === false.
   */
  public static filterContextData(
    profile: CognitiveProfile,
    longitudinal: LongitudinalReport | null
  ) {
    const domains = ['attention', 'inhibition', 'processingSpeed', 'workingMemory', 'planning'] as const;
    
    const safeRelativeLevels: Record<string, number> = {};
    const safeEvidence: Record<string, string[]> = {};
    const safeConfidenceReasons: Record<string, string> = {};
    const safeLongitudinal: Record<string, any> = {};

    domains.forEach(domain => {
      if (profile.aiEligibility[domain]) {
        safeRelativeLevels[domain] = profile.relativeLevels[domain];
        safeEvidence[domain] = profile.evidence[domain] || [];
        safeConfidenceReasons[domain] = profile.confidenceReasons[domain] || '';
        
        if (longitudinal && longitudinal[domain]) {
          safeLongitudinal[domain] = {
            direction: longitudinal[domain].direction,
            magnitude: longitudinal[domain].magnitude,
            narrative: longitudinal[domain].narrative
          };
        }
      }
    });

    return {
      safeRelativeLevels,
      safeEvidence,
      safeConfidenceReasons,
      safeLongitudinal
    };
  }
}
