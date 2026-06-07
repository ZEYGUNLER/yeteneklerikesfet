import { AIContext, AIInsight } from '../providers/AIProvider';

export class FallbackInsightGenerator {
  public static generateFallback(context: AIContext): AIInsight {
    // We construct a simple deterministic JSON that mimics the AI's output.
    
    // Gözlemler:
    let gozlemler = "Oyun içi davranışlardan elde edilen verilere göre çocuğunuz genel olarak tutarlı bir bilişsel gelişim süreci izlemektedir.";
    if (Object.values(context.longitudinalSummaries).some(v => v.direction === 'improving')) {
      gozlemler = "Oyun performansındaki düzenli artışlar, çocuğunuzun öğrenme ve uyum sağlama konusunda olumlu bir dönemde olduğunu göstermektedir.";
    }

    // Güçlü Alanlar
    const guclu = [];
    for (const [domain, summary] of Object.entries(context.longitudinalSummaries)) {
      if (summary.direction === 'improving' || context.relativeLevels[domain] >= 75) {
        guclu.push(domain);
      }
    }
    const gucluAlanlar = guclu.length > 0 
      ? `Özellikle ${guclu.join(', ')} alanlarında belirgin bir potansiyel ve kararlılık gözlemlenmektedir.`
      : `Mevcut becerilerini istikrarlı bir şekilde kullanmaya devam etmektedir.`;

    // Desteklenebilecek Alanlar
    const destek = [];
    for (const [domain, summary] of Object.entries(context.longitudinalSummaries)) {
      if (summary.direction === 'declining' || context.relativeLevels[domain] < 50) {
        destek.push(domain);
      }
    }
    const desteklenebilecek = destek.length > 0
      ? `Fırsat alanı olarak ${destek.join(', ')} becerilerini destekleyici aktivitelere yönelmek, çok yönlü gelişimi hızlandırabilir.`
      : `Mevcut gelişim seviyesinin korunması adına yeni oyun kombinasyonları denenebilir.`;

    // Öneriler
    const oneriler = context.recommendations.length > 0
      ? context.recommendations.slice(0, 2).map(r => r.title).join(' ve ') + " etkinlikleri ile gelişimi destekleyebilirsiniz."
      : "Haftada 3 gün düzenli oyun seanslarına devam edebilirsiniz.";

    const fallbackJson = {
      "Gözlemler": gozlemler,
      "Güçlü Alanlar": gucluAlanlar,
      "Desteklenebilecek Alanlar": desteklenebilecek,
      "Öneriler": oneriler
    };

    return {
      narrative: JSON.stringify(fallbackJson),
      sourceBadge: '⚙️ Sistem İçgörüsü',
      provider: 'Deterministic Fallback',
      promptVersion: 'N/A',
      generatedAt: new Date().toISOString(),
      isFallback: true
    };
  }
}
