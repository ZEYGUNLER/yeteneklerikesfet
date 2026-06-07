import { CognitiveScoringEngine, GameSessionPayload } from './cognitiveScoringEngine';
import { FatigueEngine } from './fatigueEngine';

// --- Test suite helper ---
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

function runTests() {
  console.log('--- Starting Cognitive Scoring Engine Tests ---');

  // Test 1: Rolling Weighted Average on single vs multiple sessions
  // Should normalize weights correctly
  const mockAttentionSessions1: GameSessionPayload[] = [
    {
      gameId: 'attention',
      score: 80,
      accuracy: 0.8,
      duration: 300,
      metadata: { attentionScore: 80, attentionRecoveryRate: 80 }
    }
  ];

  const profile1 = CognitiveScoringEngine.compileProfile(mockAttentionSessions1);
  assert(profile1.currentScores.attention === 80, 'Single session score should map directly (100% weight)');

  // Let's add multiple sessions (5 sessions)
  // s1 (newest): 100, s2: 90, s3: 80, s4: 70, s5: 60
  // expected weighted average: 100*0.4 + 90*0.25 + 80*0.15 + 70*0.10 + 60*0.10 = 40 + 22.5 + 12 + 7 + 6 = 87.5 => 88
  const mockAttentionSessions5: GameSessionPayload[] = [
    { gameId: 'attention', score: 60, accuracy: 0.6, duration: 300, metadata: { attentionScore: 60, attentionRecoveryRate: 60 } }, // oldest (s5)
    { gameId: 'attention', score: 70, accuracy: 0.7, duration: 300, metadata: { attentionScore: 70, attentionRecoveryRate: 70 } }, // s4
    { gameId: 'attention', score: 80, accuracy: 0.8, duration: 300, metadata: { attentionScore: 80, attentionRecoveryRate: 80 } }, // s3
    { gameId: 'attention', score: 90, accuracy: 0.9, duration: 300, metadata: { attentionScore: 90, attentionRecoveryRate: 90 } }, // s2
    { gameId: 'attention', score: 100, accuracy: 1.0, duration: 300, metadata: { attentionScore: 100, attentionRecoveryRate: 100 } } // newest (s1)
  ];

  const profile5 = CognitiveScoringEngine.compileProfile(mockAttentionSessions5);
  // Attention score is based on attentionGameScores rolling average
  assert(profile5.currentScores.attention === 88, 'Rolling average should evaluate to 88 for [100, 90, 80, 70, 60] with weights [0.4, 0.25, 0.15, 0.1, 0.1]');

  // Test 2: Confidence calculation
  // Play time = 5 * 300s = 1500s (>= 900s). Session count = 5 (>= 3). Target rounds met.
  assert(profile5.confidenceScores.attention === 1.0, 'Full confidence reached when criteria met');

  const shortSession: GameSessionPayload[] = [
    { gameId: 'attention', score: 80, accuracy: 0.8, duration: 60, metadata: { attentionScore: 80, attentionRecoveryRate: 80 } }
  ];
  const profileShort = CognitiveScoringEngine.compileProfile(shortSession);
  assert(profileShort.confidenceScores.attention < 0.5, 'Short session count & duration must produce low confidence');

  // Test 3: Missing telemetry fields gracefully fallback
  const mockMissingTelemetrySession: GameSessionPayload[] = [
    {
      gameId: 'planning', score: 0, accuracy: 0, duration: 300, createdAt: new Date().toISOString(),
      metadata: {
        planning: { routeEfficiency: 0.8, deadEnds: 2 } // Missing hints, replanning, optimalPath
      }
    }
  ];
  const profileMissingTel = CognitiveScoringEngine.compileProfile(mockMissingTelemetrySession);
  assert(profileMissingTel.currentScores.planning > 0, 'Score is calculated even if some telemetry fields are missing');

  // Test 4: Proxy data sets aiEligible = false
  const mockProxySession: GameSessionPayload[] = [
    {
      gameId: 'planning', score: 90, accuracy: 0.9, duration: 300, createdAt: new Date().toISOString(),
      metadata: { source: 'proxy', planningScore: 90 }
    }
  ];
  const profileProxy = CognitiveScoringEngine.compileProfile(mockProxySession);
  assert(profileProxy.aiEligibility.planning === false, 'AI Eligibility for planning must be false if source is proxy');

  // Test 5: High dead-end count reduces planning score
  const sessionLowDeadEnd: GameSessionPayload[] = [
    { gameId: 'planning', score: 0, accuracy: 0, duration: 300, createdAt: new Date().toISOString(), metadata: { planning: { routeEfficiency: 1, optimalPathRatio: 1, replanningQuality: 1, deadEnds: 0, hints: 0, planningTimeMs: 5000 } } }
  ];
  const sessionHighDeadEnd: GameSessionPayload[] = [
    { gameId: 'planning', score: 0, accuracy: 0, duration: 300, createdAt: new Date().toISOString(), metadata: { planning: { routeEfficiency: 1, optimalPathRatio: 1, replanningQuality: 1, deadEnds: 10, hints: 0, planningTimeMs: 5000 } } }
  ];
  const profileLowDeadEnd = CognitiveScoringEngine.compileProfile(sessionLowDeadEnd);
  const profileHighDeadEnd = CognitiveScoringEngine.compileProfile(sessionHighDeadEnd);
  assert(profileHighDeadEnd.currentScores.planning < profileLowDeadEnd.currentScores.planning, 'High dead ends must decrease planning score');

  // Test 6: High hint usage reduces planning score
  const sessionHighHints: GameSessionPayload[] = [
    { gameId: 'planning', score: 0, accuracy: 0, duration: 300, createdAt: new Date().toISOString(), metadata: { planning: { routeEfficiency: 1, optimalPathRatio: 1, replanningQuality: 1, deadEnds: 0, hints: 10, planningTimeMs: 5000 } } }
  ];
  const profileHighHints = CognitiveScoringEngine.compileProfile(sessionHighHints);
  assert(profileHighHints.currentScores.planning < profileLowDeadEnd.currentScores.planning, 'High hint usage must decrease planning score');

  // Test 7: Confidence is NOT inflated by 50 sessions on the same day
  const sameDaySessions = Array.from({ length: 50 }).map(() => ({
    gameId: 'planning', score: 100, accuracy: 1, duration: 300, createdAt: new Date().toISOString(), metadata: { planning: { routeEfficiency: 1, deadEnds: 0 } }
  }));
  const profileSpam = CognitiveScoringEngine.compileProfile(sameDaySessions);
  assert(profileSpam.confidenceScores.planning < 0.7, '50 sessions on a single day should not reach high confidence');

  // Test 8: Fatigue fallback
  // No data should default to 50, not 100
  const fatigueNoData = FatigueEngine.calculateFatigueResistance({});
  assert(fatigueNoData === 50, 'Fatigue resistance defaults to 50 when no data is provided');

  console.log('--- All Tests Passed Successfully ---');
}

// Run tests immediately
try {
  runTests();
} catch (e: any) {
  console.error('[FAIL]', e.message);
  process.exit(1);
}
