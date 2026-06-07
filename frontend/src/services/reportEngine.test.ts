import { CognitiveProfile, CognitiveDomainScores } from './cognitiveScoringEngine';
import { ReportEngine, ParentInsightReport } from './reportEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// Helper to check for clinical/diagnosing words, score values, and percentiles
function checkSafetyAndDeficits(report: ParentInsightReport, testName: string) {
  const bannedWords = [
    'dehb', 'adhd', 'dikkat eksikliği', 'bozukluğ', 'hastalık',
    'klinik', 'tedavi', 'teşhis', 'ilaç', 'sendrom', 'patoloji'
  ];

  const checkText = (text: string) => {
    const lower = text.toLowerCase();
    
    // 1. Clinical safety check
    bannedWords.forEach(word => {
      if (lower.includes(word)) {
        throw new Error(`[SAFETY BREACH] in ${testName}: Text "${text}" contains banned word "${word}"`);
      }
    });

    // 2. Score number checking (must not contain raw score numbers or percentiles like "95", "90", "80" etc)
    const hasRawNumber = /\b(100|[1-9]\d|\d)\b/.test(text); // matches integers between 0 and 100
    // We allow years "6-12" or short references if they exist, but generally avoid numbers.
    if (hasRawNumber && !text.includes("6-12")) {
      throw new Error(`[SAFETY BREACH] in ${testName}: Text "${text}" contains raw score numbers`);
    }

    // 3. Percentile terms check
    if (lower.includes('yüzdelik') || lower.includes('percentile')) {
      throw new Error(`[SAFETY BREACH] in ${testName}: Text "${text}" contains percentile terminology`);
    }
  };

  report.strengths.forEach(s => { checkText(s.title); checkText(s.description); });
  report.growthAreas.forEach(g => { checkText(g.title); checkText(g.description); });
  report.observations.forEach(o => { checkText(o.title); checkText(o.description); });
  report.recommendations.forEach(r => { checkText(r.title); checkText(r.description); });
  checkText(report.overallNarrative);
  checkText(report.confidenceSummary.message);
}

function runVerification() {
  console.log('--- Starting Rule-Based Report Engine & Narrative Verification ---');

  const testProfiles: { name: string; profile: CognitiveProfile }[] = [];

  // 1. High Performers
  testProfiles.push({
    name: "High Performer (Stable)",
    profile: {
      currentScores: { attention: 85, inhibition: 82, processingSpeed: 88, workingMemory: 90, planning: 92 },
      relativeLevels: { attention: 95, inhibition: 95, processingSpeed: 96, workingMemory: 97, planning: 98 },
      trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 88, fatigueResistance: 85 },
      confidenceScores: { attention: 1.0, inhibition: 1.0, processingSpeed: 1.0, workingMemory: 1.0, planning: 1.0 },
      confidenceReasons: { attention: '', inhibition: '', processingSpeed: '', workingMemory: '', planning: '' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  });

  // 2. Improving Trends Performer
  testProfiles.push({
    name: "High Performer (Improving)",
    profile: {
      currentScores: { attention: 90, inhibition: 85, processingSpeed: 88, workingMemory: 90, planning: 92 },
      relativeLevels: { attention: 95, inhibition: 95, processingSpeed: 96, workingMemory: 97, planning: 98 },
      trends: { attention: 'improving', inhibition: 'improving', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 88, fatigueResistance: 85 },
      confidenceScores: { attention: 1.0, inhibition: 1.0, processingSpeed: 1.0, workingMemory: 1.0, planning: 1.0 },
      confidenceReasons: { attention: '', inhibition: '', processingSpeed: '', workingMemory: '', planning: '' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  });

  // 3. Declining Trend Mixed
  testProfiles.push({
    name: "Mixed Performer (Declining)",
    profile: {
      currentScores: { attention: 45, inhibition: 75, processingSpeed: 65, workingMemory: 70, planning: 85 },
      relativeLevels: { attention: 30, inhibition: 75, processingSpeed: 50, workingMemory: 50, planning: 85 },
      trends: { attention: 'declining', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 75, fatigueResistance: 70 },
      confidenceScores: { attention: 0.9, inhibition: 0.9, processingSpeed: 0.8, workingMemory: 0.85, planning: 0.9 },
      confidenceReasons: { attention: '', inhibition: '', processingSpeed: '', workingMemory: '', planning: '' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  });

  // 4. Low Confidence Profile (All under 0.20)
  testProfiles.push({
    name: "Very Low Confidence Profile",
    profile: {
      currentScores: { attention: 70, inhibition: 75, processingSpeed: 80, workingMemory: 65, planning: 72 },
      relativeLevels: { attention: 50, inhibition: 50, processingSpeed: 50, workingMemory: 50, planning: 50 },
      trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 75, fatigueResistance: 70 },
      confidenceScores: { attention: 0.1, inhibition: 0.1, processingSpeed: 0.1, workingMemory: 0.1, planning: 0.1 },
      confidenceReasons: { attention: '', inhibition: '', processingSpeed: '', workingMemory: '', planning: '' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  });

  // 5. Contradictory & Extremes (Fast but impulsive)
  testProfiles.push({
    name: "Contradictory Speed-Inhibition",
    profile: {
      currentScores: { attention: 70, inhibition: 40, processingSpeed: 85, workingMemory: 70, planning: 70 },
      relativeLevels: { attention: 50, inhibition: 25, processingSpeed: 90, workingMemory: 50, planning: 50 },
      trends: { attention: 'stable', inhibition: 'stable', processingSpeed: 'stable', workingMemory: 'stable', planning: 'stable' },
      metaMetrics: { overallConsistencyScore: 70, fatigueResistance: 60 },
      confidenceScores: { attention: 0.8, inhibition: 0.8, processingSpeed: 0.8, workingMemory: 0.8, planning: 0.8 },
      confidenceReasons: { attention: '', inhibition: '', processingSpeed: '', workingMemory: '', planning: '' },
      aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
      evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
    }
  });

  // Generate an extra 15 mixed profiles to satisfy the 20 test profiles verification suite
  for (let i = 6; i <= 20; i++) {
    testProfiles.push({
      name: `Automated Test Profile ${i}`,
      profile: {
        currentScores: {
          attention: 50 + (i * 2) % 45,
          inhibition: 50 + (i * 3) % 45,
          processingSpeed: 50 + (i * 4) % 45,
          workingMemory: 50 + (i * 5) % 45,
          planning: 50 + (i * 6) % 45
        },
        relativeLevels: { attention: 50, inhibition: 50, processingSpeed: 50, workingMemory: 50, planning: 50 },
        trends: {
          attention: i % 3 === 0 ? 'improving' : (i % 3 === 1 ? 'stable' : 'declining'),
          inhibition: 'stable',
          processingSpeed: 'stable',
          workingMemory: 'stable',
          planning: 'stable'
        },
        metaMetrics: { overallConsistencyScore: 75, fatigueResistance: 70 },
        confidenceScores: { attention: 0.8, inhibition: 0.8, processingSpeed: 0.8, workingMemory: 0.8, planning: 0.8 },
        confidenceReasons: { attention: '', inhibition: '', processingSpeed: '', workingMemory: '', planning: '' },
        aiEligibility: { attention: true, inhibition: true, processingSpeed: true, workingMemory: true, planning: true },
        evidence: { attention: [], inhibition: [], processingSpeed: [], workingMemory: [], planning: [] }
      }
    });
  }

  assert(testProfiles.length === 20, "Verification must contain exactly 20 test profiles");

  testProfiles.forEach((tp) => {
    const report = ReportEngine.generateReport(tp.profile);

    // Verify formatting constraints
    assert(report.overallNarrative !== undefined, `${tp.name} must contain an overall narrative`);
    
    // Safety check
    checkSafetyAndDeficits(report, tp.name);

    // Specific narrative outputs validations
    if (tp.name === "Very Low Confidence Profile") {
      assert(
        report.overallNarrative.includes("daha güvenilir yorumlar oluşturabilmek için biraz daha oyun verisine ihtiyaç vardır"),
        "Very Low Confidence profile should fall back to low-confidence narrative warning"
      );
    } else if (tp.name === "High Performer (Stable)") {
      assert(
        report.overallNarrative.includes("planlı hareket etme becerisi üst seviyededir"),
        "High Performer planning strength should be described correctly"
      );
      assert(
        report.overallNarrative.includes("Bilişsel becerilerindeki kararlılık"),
        "Stable trend sentence should be appended"
      );
    } else if (tp.name === "High Performer (Improving)") {
      assert(
        report.overallNarrative.includes("performans gelişimi, becerilerinin kararlı bir şekilde yükseldiğini"),
        "Improving trend sentence should be appended"
      );
    } else if (tp.name === "Mixed Performer (Declining)") {
      assert(
        report.overallNarrative.includes("Performansta görülen küçük duraksamalar yorgunluk"),
        "Declining trend sentence should be appended"
      );
    }

    console.log(`[PASS] Verified Narrative for ${tp.name}`);
  });

  console.log('--- All 20 Narratives Verified & Validated Successfully ---');
}

try {
  runVerification();
} catch (e: any) {
  console.error('[FAIL]', e.message);
  process.exit(1);
}
