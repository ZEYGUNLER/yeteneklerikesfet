import { CognitiveProfile, CognitiveScoringEngine, GameSessionPayload, CognitiveDomainScores } from './cognitiveScoringEngine';

export type AnalysisWindow = '7d' | '30d' | '90d';
export type DevelopmentDirection = 'improving' | 'stable' | 'plateau' | 'declining';
export type DevelopmentMagnitude = 'minimal' | 'small' | 'moderate' | 'strong';
export type StabilityLevel = 'low' | 'medium' | 'high';

export interface DomainDevelopmentSummary {
  direction: DevelopmentDirection;
  magnitude: DevelopmentMagnitude;
  stability: StabilityLevel;
  velocity: number; // point change per week
  scoreChange: number;
  confidence: number;
  narrative: string;
  aiEligible: boolean;
}

export interface LongitudinalReport {
  window: AnalysisWindow;
  attention: DomainDevelopmentSummary;
  inhibition: DomainDevelopmentSummary;
  processingSpeed: DomainDevelopmentSummary;
  workingMemory: DomainDevelopmentSummary;
  planning: DomainDevelopmentSummary;
  overallNarrative: string;
  generatedAt: Date;
}

export class LongitudinalAnalysisEngine {
  private static readonly DOMAINS: (keyof CognitiveDomainScores)[] = [
    'attention',
    'inhibition',
    'processingSpeed',
    'workingMemory',
    'planning',
  ];

  /**
   * Analyzes historical game sessions to determine longitudinal development trends.
   */
  public static analyzeDevelopment(
    sessions: GameSessionPayload[],
    window: AnalysisWindow,
    currentProfile: CognitiveProfile
  ): LongitudinalReport {
    // 1. Split sessions into recent and previous windows
    const { recent, previous, actualWeeks } = this.splitSessions(sessions, window);

    // 2. If we don't have enough data to compare, return empty/stable defaults
    if (recent.length === 0 || previous.length === 0) {
      return this.generateEmptyReport(window, currentProfile);
    }

    // 3. Compile profiles for both periods
    const recentProfile = CognitiveScoringEngine.compileProfile(recent);
    const previousProfile = CognitiveScoringEngine.compileProfile(previous);

    const report: Partial<LongitudinalReport> = {
      window,
      generatedAt: new Date(),
    };

    // 4. Calculate domain summaries
    this.DOMAINS.forEach(domain => {
      const recentScore = recentProfile.currentScores[domain];
      const previousScore = previousProfile.currentScores[domain];
      const confidence = currentProfile.confidenceScores[domain];
      
      const scoreChange = recentScore - previousScore;
      // Velocity = points per week
      const velocity = parseFloat((scoreChange / actualWeeks).toFixed(2));

      // Calculate magnitude
      const magnitude = this.calculateMagnitude(scoreChange);

      // Calculate stability based on raw standard deviation of recent sessions mapped to that domain
      const stability = this.calculateStability(recent, domain);

      // Determine direction
      const direction = this.calculateDirection(scoreChange, magnitude, stability, window, confidence);

      // Generate Domain Narrative
      const narrative = this.generateDomainNarrative(domain, direction, stability, confidence);

      const aiEligible = currentProfile.aiEligibility[domain];

      report[domain] = {
        direction,
        magnitude,
        stability,
        velocity,
        scoreChange,
        confidence,
        narrative,
        aiEligible,
      };
    });

    report.overallNarrative = this.generateOverallNarrative(report as LongitudinalReport);

    return report as LongitudinalReport;
  }

  /**
   * Splits sessions into two chronological buckets: recent and previous.
   * If the time-based window is sparse, falls back to a 50/50 split of sorted sessions.
   */
  private static splitSessions(sessions: GameSessionPayload[], window: AnalysisWindow) {
    let days = 7;
    if (window === '30d') days = 30;
    if (window === '90d') days = 90;

    const now = Date.now();
    const limitTime = now - days * 24 * 60 * 60 * 1000;
    const prevLimitTime = now - 2 * days * 24 * 60 * 60 * 1000;

    // Ensure sessions are sorted chronologically
    const sorted = [...sessions].sort((a, b) => {
      const da = new Date(a.createdAt || new Date()).getTime();
      const db = new Date(b.createdAt || new Date()).getTime();
      return da - db;
    });

    let recent = sorted.filter(s => new Date(s.createdAt || new Date()).getTime() >= limitTime);
    let previous = sorted.filter(s => {
      const t = new Date(s.createdAt || new Date()).getTime();
      return t >= prevLimitTime && t < limitTime;
    });

    let actualWeeks = days / 7;

    // Fallback if sparse
    if (recent.length < 1 || previous.length < 1) {
      if (sorted.length >= 2) {
        const mid = Math.floor(sorted.length / 2);
        previous = sorted.slice(0, mid);
        recent = sorted.slice(mid);
        // Estimate weeks based on chronological distance between the two sets
        const oldestRecent = new Date(recent[0].createdAt || new Date()).getTime();
        const oldestPrev = new Date(previous[0].createdAt || new Date()).getTime();
        actualWeeks = Math.max(1, (oldestRecent - oldestPrev) / (1000 * 60 * 60 * 24 * 7));
      }
    }

    return { recent, previous, actualWeeks };
  }

  private static calculateMagnitude(scoreChange: number): DevelopmentMagnitude {
    const abs = Math.abs(scoreChange);
    if (abs < 3) return 'minimal';
    if (abs < 7) return 'small';
    if (abs < 15) return 'moderate';
    return 'strong';
  }

  private static calculateStability(recentSessions: GameSessionPayload[], domain: string): StabilityLevel {
    // Map domain to relevant games
    let relevantGames: string[] = [];
    if (domain === 'attention') relevantGames = ['attention', 'reaction', 'logic'];
    if (domain === 'inhibition') relevantGames = ['attention', 'reaction', 'logic', 'planning'];
    if (domain === 'processingSpeed') relevantGames = ['reaction', 'logic', 'attention', 'pattern_memory', 'planning'];
    if (domain === 'workingMemory') relevantGames = ['pattern_memory'];
    if (domain === 'planning') relevantGames = ['planning', 'memory'];

    const domainSessions = recentSessions.filter(s => relevantGames.includes(s.gameId));
    if (domainSessions.length < 2) return 'medium'; // Not enough data for variance

    // Rough SD estimate based on game scores
    const scores = domainSessions.map(s => s.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
    const sd = Math.sqrt(variance);

    if (sd < 4) return 'high';
    if (sd < 12) return 'medium';
    return 'low';
  }

  private static calculateDirection(
    scoreChange: number,
    magnitude: DevelopmentMagnitude,
    stability: StabilityLevel,
    window: AnalysisWindow,
    confidence: number
  ): DevelopmentDirection {
    // Noise Filter: Small changes are always stable
    if (magnitude === 'minimal') {
      // Plateau detection: Minimal change, high stability, over a long period
      if (stability === 'high' && (window === '30d' || window === '90d')) {
        return 'plateau';
      }
      return 'stable';
    }

    // Directionality logic
    if (scoreChange >= 3) {
      // Conservative constraint if confidence is medium/low (0.3 - 0.5)
      if (confidence < 0.5 && magnitude === 'small') {
        return 'stable';
      }
      return 'improving';
    } else if (scoreChange <= -3) {
      if (confidence < 0.5 && magnitude === 'small') {
        return 'stable';
      }
      return 'declining';
    }

    return 'stable';
  }

  private static getDomainTurkishName(domain: string): string {
    switch (domain) {
      case 'attention': return 'Dikkat';
      case 'inhibition': return 'Dürtü Kontrolü';
      case 'processingSpeed': return 'İşlem Hızı';
      case 'workingMemory': return 'Çalışan Bellek';
      case 'planning': return 'Planlama';
      default: return domain;
    }
  }

  private static generateDomainNarrative(
    domain: keyof CognitiveDomainScores,
    direction: DevelopmentDirection,
    stability: StabilityLevel,
    confidence: number
  ): string {
    const domainName = this.getDomainTurkishName(domain);

    // Confidence Gate
    if (confidence < 0.30) {
      return `Bu alan için gelişim eğilimini değerlendirmek adına daha fazla oyun verisine ihtiyaç vardır.`;
    }

    if (direction === 'improving') {
      if (stability === 'high') {
        return `${domainName} alanında son dönemde düzenli ve kararlı bir gelişim gözlenmektedir.`;
      } else {
        return `${domainName} performansında dalgalı olmakla birlikte yükselen bir eğilim görülmektedir.`;
      }
    }

    if (direction === 'plateau') {
      return `${domainName} alanında uzun süredir istikrarlı ve yerleşmiş bir performans sergilemektedir.`;
    }

    if (direction === 'declining') {
      return `Son dönemde ${domainName.toLowerCase()} performansında hafif bir yavaşlama veya değişkenlik gözlenmiş olup yorgunluk faktörleri değerlendirilebilir.`;
    }

    // Default to stable
    if (stability === 'high') {
      return `${domainName} performansı genel olarak istikrarlı ve dengeli seyretmektedir.`;
    } else {
      return `${domainName} becerilerinde dönemsel değişkenlikler görülmüş olsa da genel performans korunmaktadır.`;
    }
  }

  private static generateOverallNarrative(report: LongitudinalReport): string {
    const improvingCount = this.DOMAINS.filter(d => report[d].direction === 'improving').length;
    const plateauCount = this.DOMAINS.filter(d => report[d].direction === 'plateau').length;
    const decliningCount = this.DOMAINS.filter(d => report[d].direction === 'declining').length;

    if (improvingCount >= 2) {
      return 'Çocuğunuz son inceleme döneminde birden fazla bilişsel alanda gelişim göstermiş, oldukça verimli bir süreç geçirmiştir.';
    }
    if (plateauCount >= 2) {
      return 'Çocuğunuzun bilişsel performansında mevcut becerilerin pekiştiği, kararlı ve oturmuş bir dönem gözlemlenmektedir.';
    }
    if (decliningCount >= 2) {
      return 'Son haftalardaki oyun performansında görülen yavaşlamalar ışığında, oyun sürelerinin yorgunluk oluşturmayacak şekilde düzenlenmesi faydalı olabilir.';
    }

    return 'Genel bilişsel gelişim seyri, olağan beklentiler dahilinde dengeli ve istikrarlı bir şekilde devam etmektedir.';
  }

  private static generateEmptyReport(window: AnalysisWindow, profile: CognitiveProfile): LongitudinalReport {
    const emptySummary = (domain: keyof CognitiveDomainScores): DomainDevelopmentSummary => ({
      direction: 'stable',
      magnitude: 'minimal',
      stability: 'medium',
      velocity: 0,
      scoreChange: 0,
      confidence: profile.confidenceScores[domain],
      narrative: 'Bu alan için gelişim eğilimini değerlendirmek adına daha fazla oyun verisine ihtiyaç vardır.',
      aiEligible: profile.aiEligibility[domain],
    });

    return {
      window,
      generatedAt: new Date(),
      attention: emptySummary('attention'),
      inhibition: emptySummary('inhibition'),
      processingSpeed: emptySummary('processingSpeed'),
      workingMemory: emptySummary('workingMemory'),
      planning: emptySummary('planning'),
      overallNarrative: 'Gelişim yolculuğu analizi için daha fazla oyun oturumunun tamamlanması beklenmektedir.',
    };
  }
}
