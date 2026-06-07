import { LongitudinalAnalysisEngine, AnalysisWindow } from './longitudinalAnalysisEngine';
import { GameSessionPayload, CognitiveProfile } from './cognitiveScoringEngine';

describe('LongitudinalAnalysisEngine', () => {
  const mockBaseProfile: CognitiveProfile = {
    currentScores: { attention: 50, inhibition: 50, processingSpeed: 50, workingMemory: 50, planning: 50 },
    relativeLevels: { attention: 50, inhibition: 50, processingSpeed: 50, workingMemory: 50, planning: 50 },
    trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
    metaMetrics: { overallConsistencyScore: 80, fatigueResistance: 80 },
    confidenceScores: { attention: 0.8, inhibition: 0.8, processingSpeed: 0.8, workingMemory: 0.8, planning: 0.8 },
    confidenceReasons: { attention: '', inhibition: '', processingSpeed: '', workingMemory: '', planning: '' },
    aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
    evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
  };

  const createMockSessions = (baseScore: number, trendMultiplier: number, numSessions: number, daysAgoStart: number, gameId: string = 'planning'): GameSessionPayload[] => {
    return Array.from({ length: numSessions }).map((_, i) => ({
      gameId,
      score: baseScore + (i * trendMultiplier),
      accuracy: (baseScore + (i * trendMultiplier)) / 100,
      duration: 300,
      createdAt: new Date(Date.now() - (daysAgoStart - i) * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        planningScore: baseScore + (i * trendMultiplier),
        attentionScore: baseScore + (i * trendMultiplier),
        reactionTimeMedian: 500, // keep stable
        maxSpanReached: 5, // keep stable
      }
    }));
  };

  test('detects improving profile correctly', () => {
    const prev = createMockSessions(40, 0, 10, 60, 'planning');
    const recent = createMockSessions(60, 2, 10, 20, 'planning');
    const sessions = [...prev, ...recent];

    const report = LongitudinalAnalysisEngine.analyzeDevelopment(sessions, '30d', mockBaseProfile);

    expect(report.planning.direction).toBe('improving');
    expect(report.planning.scoreChange).toBeGreaterThan(5);
    expect(report.planning.velocity).toBeGreaterThan(0);
  });

  test('detects plateau profile correctly (high stability, minimal magnitude, long window)', () => {
    const prev = createMockSessions(70, 0, 10, 60, 'planning');
    const recent = createMockSessions(70, 0, 10, 20, 'planning');
    const sessions = [...prev, ...recent];

    const report = LongitudinalAnalysisEngine.analyzeDevelopment(sessions, '30d', mockBaseProfile);

    expect(report.planning.direction).toBe('plateau');
    expect(report.planning.magnitude).toBe('minimal');
    expect(report.planning.stability).toBe('high');
  });

  test('detects declining profile correctly', () => {
    const prev = createMockSessions(80, 0, 10, 60, 'planning');
    const recent = createMockSessions(60, -2, 10, 20, 'planning');
    const sessions = [...prev, ...recent];

    const report = LongitudinalAnalysisEngine.analyzeDevelopment(sessions, '30d', mockBaseProfile);

    expect(report.planning.direction).toBe('declining');
    expect(report.planning.scoreChange).toBeLessThan(-5);
  });

  test('returns low confidence gate string when confidence is too low', () => {
    const sessions = createMockSessions(50, 0, 10, 20, 'planning');
    const lowConfProfile = { ...mockBaseProfile, confidenceScores: { ...mockBaseProfile.confidenceScores, planning: 0.1 } };
    
    const report = LongitudinalAnalysisEngine.analyzeDevelopment(sessions, '30d', lowConfProfile);

    expect(report.planning.narrative).toContain('daha fazla oyun verisine ihtiyaç vardır');
  });

  test('filters noise and considers small fluctuations as stable', () => {
    // 70 to 72 is small enough to be stable, not improving
    const prev = createMockSessions(70, 0, 10, 60, 'planning');
    const recent = createMockSessions(72, 0, 10, 20, 'planning');
    const sessions = [...prev, ...recent];

    const report = LongitudinalAnalysisEngine.analyzeDevelopment(sessions, '30d', mockBaseProfile);

    // Because it is 30d window and SD is very low (0), it might actually trigger plateau
    // but definitely NOT improving. Let's assert it is either stable or plateau
    expect(['stable', 'plateau']).toContain(report.planning.direction);
    expect(report.planning.magnitude).toBe('minimal');
  });

  test('SAFETY GATING: NO diagnostic language in output', () => {
    const scenarios = [
      createMockSessions(20, -5, 20, 40, 'attention'), // Severe decline
      createMockSessions(10, 0, 5, 10, 'inhibition'), // Very low score, high impulse
      createMockSessions(90, 1, 30, 90, 'processingSpeed'), // Hyper-fast
      createMockSessions(50, 20, 5, 20, 'planning'), // High fluctuation
    ];

    const forbiddenWords = [
      'DEHB', 'dikkat eksikliği', 'bozukluk', 'teşhis', 'tedavi', 'klinik', 'sendrom', 'ilaç', 'hastalık', 'risk', 'patolojik'
    ];

    scenarios.forEach(sessions => {
      const report = LongitudinalAnalysisEngine.analyzeDevelopment(sessions, '30d', mockBaseProfile);
      
      const allText = [
        report.overallNarrative,
        report.attention.narrative,
        report.inhibition.narrative,
        report.processingSpeed.narrative,
        report.workingMemory.narrative,
        report.planning.narrative
      ].join(' ').toLowerCase();

      forbiddenWords.forEach(word => {
        expect(allText).not.toContain(word.toLowerCase());
      });
    });
  });
});
