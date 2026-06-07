import { AIInsight } from './providers/AIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { AIContextBuilder } from './context/AIContextBuilder';
import { AIOutputValidator } from './safety/AIOutputValidator';
import { FallbackInsightGenerator } from './fallback/FallbackInsightGenerator';
import { AIInsightCache } from './cache/AIInsightCache';
import { CognitiveProfile } from '../cognitiveScoringEngine';
import { LongitudinalReport } from '../longitudinalAnalysisEngine';
import { AdaptiveRecommendationReport } from '../adaptiveRecommendationEngine';

export class AIInsightService {
  private static provider = new GeminiProvider();

  public static async generateInsight(
    childId: string,
    profile: CognitiveProfile,
    longitudinal: LongitudinalReport | null,
    recommendations: AdaptiveRecommendationReport | null
  ): Promise<AIInsight> {
    const context = AIContextBuilder.build(profile, longitudinal, recommendations);

    // 1. Check Cache
    const cachedInsight = await AIInsightCache.get(childId, context);
    if (cachedInsight) {
      return cachedInsight;
    }

    // 2. Generate via Provider
    try {
      if (!await this.provider.isAvailable()) {
        throw new Error('Provider not available');
      }

      const insight = await this.provider.generateInsight(context);

      // 3. Validate Output
      AIOutputValidator.validate(insight.narrative);

      // Clean the JSON string (remove markdown)
      insight.narrative = AIOutputValidator.cleanJson(insight.narrative);

      // 4. Cache and Return
      await AIInsightCache.set(childId, context, insight);
      return insight;

    } catch (error) {
      // 5. Silent Fallback on Failure
      console.warn('AI Insight Generation Failed. Triggering Fallback.', error);
      return FallbackInsightGenerator.generateFallback(context);
    }
  }
}
