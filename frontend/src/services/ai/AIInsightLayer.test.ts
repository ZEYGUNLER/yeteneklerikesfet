import { AIInsightService } from './AIInsightService';
import { AIEligibilityFilter } from './context/AIEligibilityFilter';
import { AIOutputValidator } from './safety/AIOutputValidator';
import { CognitiveProfile } from '../cognitiveScoringEngine';

describe('Phase A7: AI Insight Layer', () => {
  const createMockProfile = (eligibility: Record<string, boolean>): CognitiveProfile => ({
    currentScores: { attention: 80, inhibition: 80, processingSpeed: 80, workingMemory: 80, planning: 80 },
    relativeLevels: { attention: 80, inhibition: 80, processingSpeed: 80, workingMemory: 80, planning: 80 },
    trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
    metaMetrics: { overallConsistencyScore: 80, fatigueResistance: 80 },
    confidenceScores: { attention: 0.8, inhibition: 0.8, processingSpeed: 0.8, workingMemory: 0.8, planning: 0.8 },
    confidenceReasons: { attention: '', inhibition: '', processingSpeed: '', workingMemory: '', planning: '' },
    aiEligibility: eligibility as any,
    evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
  });

  test('Test 4: Validation Failure (Banned Words) throws error', () => {
    const badOutput = '{"Gözlemler": "Dikkat eksikliği var", "Güçlü Alanlar": "", "Desteklenebilecek Alanlar": "", "Öneriler": ""}';
    expect(() => AIOutputValidator.validate(badOutput)).toThrow(/banned word/);
  });

  test('Test 5: Proxy Domain Filtering removes aiEligibility=false domains', () => {
    const profile = createMockProfile({
      attention: true,
      inhibition: true,
      processingSpeed: true,
      workingMemory: true,
      planning: false // Proxy data
    });

    const filtered = AIEligibilityFilter.filterContextData(profile, null);
    
    expect(filtered.safeRelativeLevels.attention).toBeDefined();
    expect(filtered.safeRelativeLevels.planning).toBeUndefined(); // MUST be stripped
  });

  test('Test 8: Output Validation (Missing Sections) throws error', () => {
    const badOutput = '{"Gözlemler": "İyi", "Öneriler": "Yok"}';
    // Must be at least 150 chars to avoid short length error, so pad it
    const padded = badOutput.padEnd(160, ' ');
    expect(() => AIOutputValidator.validate(padded)).toThrow(/Missing mandatory section/);
  });

  test('Test 10: Fallback generation is deterministic', async () => {
    // Force a fallback by passing null profile (will throw error internally but caught by service)
    const result = await AIInsightService.generateInsight('child_1', null as any, null, null);
    expect(result.isFallback).toBe(true);
    expect(result.sourceBadge).toBe('⚙️ Sistem İçgörüsü');
    expect(result.narrative.includes('Gözlemler')).toBe(true);
  });
});
