import { CognitiveProfile } from '../../cognitiveScoringEngine';
import { LongitudinalReport } from '../../longitudinalAnalysisEngine';
import { AdaptiveRecommendationReport } from '../../adaptiveRecommendationEngine';
import { AIContext } from '../providers/AIProvider';
import { AIEligibilityFilter } from './AIEligibilityFilter';

export class AIContextBuilder {
  public static build(
    profile: CognitiveProfile,
    longitudinal: LongitudinalReport | null,
    recommendationsReport: AdaptiveRecommendationReport | null
  ): AIContext {
    const { 
      safeRelativeLevels, 
      safeEvidence, 
      safeConfidenceReasons, 
      safeLongitudinal 
    } = AIEligibilityFilter.filterContextData(profile, longitudinal);

    const safeRecommendations = recommendationsReport ? recommendationsReport.recommendations.map(r => ({
      title: r.title,
      description: r.description,
      rationale: r.rationale,
      category: r.category
    })) : [];

    return {
      relativeLevels: safeRelativeLevels,
      longitudinalSummaries: safeLongitudinal,
      recommendations: safeRecommendations,
      evidence: safeEvidence,
      confidenceReasons: safeConfidenceReasons,
      puzzlePersistence: profile.metaMetrics.fatigueResistance
    };
  }
}
