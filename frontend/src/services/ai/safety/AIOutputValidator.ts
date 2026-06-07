export class AIOutputValidator {
  private static BANNED_WORDS = [
    'adhd', 'dehb', 'dikkat eksikliği', 'hiperaktivite',
    'bozukluk', 'bozukluğu', 'sendrom', 'tedavi',
    'hastalık', 'teşhis', 'tanı', 'klinik',
    'disleksi', 'otizm', 'asperger',
    'dürtüsel', 'hiperaktif', 'problemli', 'eksik',
    'zayıf', 'geride', 'riskli'
  ];

  private static MANDATORY_SECTIONS = [
    '"Gözlemler"',
    '"Güçlü Alanlar"',
    '"Desteklenebilecek Alanlar"',
    '"Öneriler"'
  ];

  public static validate(jsonString: string): boolean {
    if (!jsonString || jsonString.trim().length === 0) {
      throw new Error('Validation Failed: Empty output');
    }

    if (jsonString.length < 150) {
      throw new Error('Validation Failed: Output too short (<150 chars)');
    }

    if (jsonString.length > 2000) { // Slightly higher than 1200 as JSON overhead exists, but let's check content roughly
      throw new Error('Validation Failed: Output too long (>2000 chars)');
    }

    const lowerStr = jsonString.toLowerCase();

    // 1. Banned words check
    for (const word of this.BANNED_WORDS) {
      if (lowerStr.includes(word)) {
        throw new Error(`Validation Failed: Output contains banned word: ${word}`);
      }
    }

    // 2. Mandatory sections check
    for (const section of this.MANDATORY_SECTIONS) {
      // JSON might have spacing, so we check if the string contains the exact key
      // Actually we just check if it contains the word 'Gözlemler' etc.
      const cleanSection = section.replace(/"/g, '');
      if (!jsonString.includes(cleanSection)) {
        throw new Error(`Validation Failed: Missing mandatory section: ${cleanSection}`);
      }
    }

    // 3. Must be valid JSON
    try {
      // Sometimes LLMs wrap JSON in markdown blocks like ```json ... ```
      let cleanJson = jsonString.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.substring(7);
        if (cleanJson.endsWith('```')) {
          cleanJson = cleanJson.substring(0, cleanJson.length - 3);
        }
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.substring(3);
        if (cleanJson.endsWith('```')) {
          cleanJson = cleanJson.substring(0, cleanJson.length - 3);
        }
      }
      JSON.parse(cleanJson);
    } catch (e) {
      throw new Error('Validation Failed: Output is not valid JSON');
    }

    return true;
  }

  public static cleanJson(jsonString: string): string {
    let cleanJson = jsonString.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    }
    return cleanJson.trim();
  }
}
