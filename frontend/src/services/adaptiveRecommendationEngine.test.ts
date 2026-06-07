import { AdaptiveRecommendationEngine } from './adaptiveRecommendationEngine';
import { CognitiveProfile } from './cognitiveScoringEngine';
import { LongitudinalReport } from './longitudinalAnalysisEngine';

describe('AdaptiveRecommendationEngine', () => {
  const createMockProfile = (scores: Partial<Record<keyof CognitiveProfile['currentScores'], number>>, confidence: number = 0.8): CognitiveProfile => {
    return {
      currentScores: { attention: 60, inhibition: 60, processingSpeed: 60, workingMemory: 60, planning: 60, ...scores },
      relativeLevels: { attention: 50, inhibition: 50, processingSpeed: 50, workingMemory: 50, planning: 50 },
      trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 80, fatigueResistance: 80 },
      confidenceScores: { attention: confidence, inhibition: confidence, processingSpeed: confidence, workingMemory: confidence, planning: confidence },
      confidenceReasons: { attention: 'test', inhibition: 'test', processingSpeed: 'test', workingMemory: 'test', planning: 'test' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    };
  };

  test('generates diversity triplet for growth domain', () => {
    const profile = createMockProfile({ workingMemory: 40 });
    const report = AdaptiveRecommendationEngine.generateRecommendations(profile, null);
    
    const wmRecs = report.recommendations.filter(r => r.id.includes('wm_g'));
    expect(wmRecs.length).toBe(3); // Game, Home Activity, Daily Routine
    
    const categories = wmRecs.map(r => r.category);
    expect(categories).toContain('game');
    expect(categories).toContain('home_activity');
    expect(categories).toContain('daily_routine');
  });

  test('does not generate high priority recommendations for low confidence', () => {
    const profile = createMockProfile({ workingMemory: 40 }, 0.2); // Low confidence
    const report = AdaptiveRecommendationEngine.generateRecommendations(profile, null);
    
    // Domain specific shouldn't be generated at all for conf < 0.3
    const wmRecs = report.recommendations.filter(r => r.id.includes('wm'));
    expect(wmRecs.length).toBe(0);

    // Session rec for low data
    const sessionRec = report.recommendations.find(r => r.category === 'session');
    expect(sessionRec?.title).toContain('Veri Kalitesini Artırmak');
  });

  test('generates strength reinforcement for high scores', () => {
    const profile = createMockProfile({ planning: 85 });
    const report = AdaptiveRecommendationEngine.generateRecommendations(profile, null);
    
    const plRecs = report.recommendations.filter(r => r.id.includes('pl_s') && r.type === 'strength_reinforcement');
    expect(plRecs.length).toBeGreaterThan(0);
    expect(plRecs[0].rationale).toContain('belirgin güçlülüğü korumak');
  });

  test('evaluates cross-domain combinations (Fast & Impulsive)', () => {
    const profile = createMockProfile({ processingSpeed: 80, inhibition: 40 });
    const report = AdaptiveRecommendationEngine.generateRecommendations(profile, null);
    
    const crossRec = report.recommendations.find(r => r.id === 'cross_ps_in');
    expect(crossRec).toBeDefined();
    expect(crossRec?.title).toContain('Yavaşlatıcı Etkinlikler');
  });

  test('SAFETY GATING: Output must not contain diagnostic terminology', () => {
    const profiles = [
      createMockProfile({ attention: 20, inhibition: 20 }), // Extremely low (ADHD-like profile but must not say it)
      createMockProfile({ workingMemory: 30, planning: 40 }), // Learning disorder-like profile
      createMockProfile({ processingSpeed: 90, inhibition: 30 }) // Hyperactive-like profile
    ];

    const forbiddenWords = ['DEHB', 'dikkat eksikliği', 'bozukluk', 'tedavi', 'ilaç', 'klinik', 'sendrom', 'teşhis', 'hastalık'];

    profiles.forEach(p => {
      const report = AdaptiveRecommendationEngine.generateRecommendations(p, null);
      
      report.recommendations.forEach(rec => {
        const text = [rec.title, rec.description, rec.rationale].join(' ').toLowerCase();
        forbiddenWords.forEach(word => {
          expect(text).not.toContain(word.toLowerCase());
        });
      });
    });
  });
});
