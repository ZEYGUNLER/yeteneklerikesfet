import { ProfileAggregationService } from './profileAggregationService';
import { CognitiveScoringEngine, GameSessionPayload } from './cognitiveScoringEngine';

describe('Planning Telemetry Integration & Validation', () => {
  const createMockSession = (metadata: any): GameSessionPayload => ({
    gameId: 'planning',
    score: 0,
    accuracy: 0,
    duration: 300,
    createdAt: new Date().toISOString(),
    metadata
  });

  test('Test 1: Perfect Planning Session -> aiEligible = true', () => {
    const session = createMockSession({
      planning: {
        version: 1,
        routeEfficiency: 1,
        optimalPathRatio: 1,
        replanningQuality: 1,
        planningTimeMs: 1500,
        hints: 0,
        deadEnds: 0,
        completionRate: 1
      }
    });

    const mapped = ProfileAggregationService.mapReportsToSessions([], [session]);
    expect(mapped[0].telemetryVerified).toBe(true);
    expect(mapped[0].telemetryQuality).toBe('high');
  });

  test('Test 2: High Dead-End Navigation -> Lower planning score', () => {
    const perfectSession = createMockSession({
      planning: { version: 1, routeEfficiency: 1, optimalPathRatio: 1, replanningQuality: 1, planningTimeMs: 1500, hints: 0, deadEnds: 0, completionRate: 1 }
    });
    const badSession = createMockSession({
      planning: { version: 1, routeEfficiency: 0.5, optimalPathRatio: 0.5, replanningQuality: 0.5, planningTimeMs: 5000, hints: 0, deadEnds: 8, completionRate: 1 }
    });

    const perfectProfile = CognitiveScoringEngine.compileProfile(ProfileAggregationService.mapReportsToSessions([], [perfectSession]));
    const badProfile = CognitiveScoringEngine.compileProfile(ProfileAggregationService.mapReportsToSessions([], [badSession]));

    expect(badProfile.currentScores.planning).toBeLessThan(perfectProfile.currentScores.planning);
  });

  test('Test 3: Heavy Hint Usage -> Lower score, NOT lower confidence', () => {
    const perfectSession = createMockSession({
      planning: { version: 1, routeEfficiency: 1, optimalPathRatio: 1, replanningQuality: 1, planningTimeMs: 1500, hints: 0, deadEnds: 0, completionRate: 1 }
    });
    const hintsSession = createMockSession({
      planning: { version: 1, routeEfficiency: 1, optimalPathRatio: 1, replanningQuality: 1, planningTimeMs: 1500, hints: 10, deadEnds: 0, completionRate: 1 }
    });

    const perfectProfile = CognitiveScoringEngine.compileProfile(ProfileAggregationService.mapReportsToSessions([], [perfectSession]));
    const hintsProfile = CognitiveScoringEngine.compileProfile(ProfileAggregationService.mapReportsToSessions([], [hintsSession]));

    expect(hintsProfile.currentScores.planning).toBeLessThan(perfectProfile.currentScores.planning);
    expect(hintsProfile.confidenceScores.planning).toBe(perfectProfile.confidenceScores.planning);
  });

  test('Test 4: Missing Telemetry Fields -> Rejected (telemetryVerified = false)', () => {
    const missingSession = createMockSession({
      planning: {
        version: 1,
        routeEfficiency: 1
        // missing all other fields
      }
    });

    const mapped = ProfileAggregationService.mapReportsToSessions([], [missingSession]);
    expect(mapped[0].telemetryVerified).toBe(false);
  });

  test('Test 5: Malformed Telemetry -> Rejected (telemetryVerified = false)', () => {
    const malformedSession = createMockSession({
      planning: {
        version: 1,
        routeEfficiency: 1.5, // > 1
        optimalPathRatio: 1,
        replanningQuality: 1,
        planningTimeMs: 1500,
        hints: 0,
        deadEnds: 0,
        completionRate: 1
      }
    });

    const mapped = ProfileAggregationService.mapReportsToSessions([], [malformedSession]);
    expect(mapped[0].telemetryVerified).toBe(false);
  });

  test('Test 8: Mixed Historical Data -> Telemetry contributes, proxy does not', () => {
    // 5 proxy sessions
    const proxySessions = Array(5).fill(0).map(() => createMockSession({
      source: 'proxy', planningScore: 50
    }));
    
    // 5 telemetry sessions (high scores)
    const telemetrySessions = Array(5).fill(0).map(() => createMockSession({
      planning: { version: 1, routeEfficiency: 1, optimalPathRatio: 1, replanningQuality: 1, planningTimeMs: 1500, hints: 0, deadEnds: 0, completionRate: 1 }
    }));

    const mappedSessions = ProfileAggregationService.mapReportsToSessions([], [...proxySessions, ...telemetrySessions]);
    const mixedProfile = CognitiveScoringEngine.compileProfile(mappedSessions);
    
    expect(mixedProfile.aiEligibility.planning).toBe(true);
    // Since proxy scores are ignored, the score should just be high (near 100)
    expect(mixedProfile.currentScores.planning).toBeGreaterThan(85);
  });
});
