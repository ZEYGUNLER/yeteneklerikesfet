export interface AIContext {
  relativeLevels: Record<string, number>;
  longitudinalSummaries: Record<string, any>;
  recommendations: any[];
  evidence: Record<string, string[]>;
  confidenceReasons: Record<string, string>;
  puzzlePersistence?: number; // Safe transformation from fatigueResistance
}

export interface AIInsight {
  narrative: string;
  sourceBadge: '✅ Gemini Insight' | '✅ OpenAI Insight' | '✅ Claude Insight' | '⚙️ Sistem İçgörüsü';
  provider: string;
  promptVersion: string;
  generatedAt: string;
  isFallback: boolean;
}

export interface AIProvider {
  generateInsight(context: AIContext): Promise<AIInsight>;
  isAvailable(): Promise<boolean>;
  getProviderName(): string;
}
