import { AIProvider, AIContext, AIInsight } from './AIProvider';
import { ParentInsightPrompt } from '../prompts/parentInsightPrompt';
import { PROMPT_VERSION } from '../prompts/promptVersions';

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  }

  public getProviderName(): string {
    return 'Gemini 2.5 Flash';
  }

  public async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  public async generateInsight(context: AIContext): Promise<AIInsight> {
    if (!await this.isAvailable()) {
      throw new Error('Gemini API key is missing.');
    }

    const promptText = ParentInsightPrompt.buildPrompt(context);

    const requestBody = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        temperature: 0.2, // Low temperature for high deterministic safety
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedText) {
        throw new Error('Empty response from Gemini');
      }

      return {
        narrative: generatedText,
        sourceBadge: '✅ Gemini Insight',
        provider: this.getProviderName(),
        promptVersion: PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
        isFallback: false
      };
    } catch (e: any) {
      clearTimeout(timeoutId);
      throw e;
    }
  }
}
