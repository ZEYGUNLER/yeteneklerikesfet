import type { SkillSummary } from '../types/dashboard.types';

export function generateInsights(summary: SkillSummary | null, sessionCount: number = 0): string[] {
  const insights: string[] = [];

  if (!summary) {
    return ['Çocuğunuz oyun oynadıkça kişiselleştirilmiş analizler burada belirecek.'];
  }

  if (sessionCount < 3) {
    insights.push('Sistem, çocuğunuzun öğrenme hızını tanımak için veri toplamaya devam ediyor.');
    return insights;
  }

  const { memory, attention, logic } = summary;

  // Determine strengths and areas to develop
  if (attention > 70) {
    insights.push('Dikkat gerektiren görevlerde son derece başarılı ve odaklanabiliyor.');
  }

  if (logic > memory + 20) {
    insights.push('Problem çözme becerisi, hafıza oyunlarından daha hızlı ilerliyor.');
  } else if (memory > logic + 20) {
    insights.push('Görsel ve işitsel hafızası çok güçlü, bilgileri kolayca aklında tutabiliyor.');
  }

  if (memory < 40 && attention < 40 && logic < 40) {
    insights.push('Oyunları oynamaya yeni başlıyor, zamanla tüm becerilerinde gelişme göreceğiz.');
  } else if (memory > 80 && attention > 80 && logic > 80) {
    insights.push('Tüm temel bilişsel alanlarda üstün performans gösteriyor. Harika bir denge!');
  } else {
    // Check for specific areas that might need a bit more play
    const lowest = Math.min(memory, attention, logic);
    if (lowest === logic && logic < 50) {
      insights.push('Mantık oyunlarında pratik yapmak problem çözme becerilerini daha da geliştirecektir.');
    } else if (lowest === attention && attention < 50) {
      insights.push('Kısa odaklanma süreleriyle dikkat oyunlarını sık tekrarlamak faydalı olabilir.');
    } else if (lowest === memory && memory < 50) {
      insights.push('Hafıza eşleştirme oyunları ile görsel belleğini güçlendirmeye devam edebiliriz.');
    }
  }

  if (insights.length === 0) {
    insights.push('Bilişsel gelişimi dengeli ve istikrarlı bir şekilde ilerliyor.');
  }

  return insights;
}
