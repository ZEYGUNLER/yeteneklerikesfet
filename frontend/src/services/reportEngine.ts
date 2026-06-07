import { CognitiveProfile, CognitiveDomainScores } from './cognitiveScoringEngine';

export interface InsightItem {
  domain:
    | 'attention'
    | 'inhibition'
    | 'processingSpeed'
    | 'workingMemory'
    | 'planning';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface RecommendationItem {
  domain:
    | 'attention'
    | 'inhibition'
    | 'processingSpeed'
    | 'workingMemory'
    | 'planning';
  title: string;
  description: string;
}

export interface ConfidenceSummary {
  overallConfidence: number; // 0.0 to 1.0
  message: string;
}

export interface ParentInsightReport {
  strengths: InsightItem[];
  growthAreas: InsightItem[];
  observations: InsightItem[];
  recommendations: RecommendationItem[];
  confidenceSummary: ConfidenceSummary;
  overallNarrative: string;
}

export class ReportEngine {
  /**
   * Generates a parent-friendly, deterministic, rule-based interpretation report.
   */
  public static generateReport(profile: CognitiveProfile): ParentInsightReport {
    const strengths: InsightItem[] = [];
    const growthAreas: InsightItem[] = [];
    const observations: InsightItem[] = [];
    const recommendations: RecommendationItem[] = [];

    const domains: (keyof CognitiveDomainScores)[] = [
      'attention',
      'inhibition',
      'processingSpeed',
      'workingMemory',
      'planning',
    ];

    // 1. Process Domain Insights
    domains.forEach(domain => {
      const score = profile.currentScores[domain];
      const confidence = profile.confidenceScores[domain];

      // Rule: Do not generate interpretation if confidence is under 20%
      if (confidence < 0.20) {
        observations.push({
          domain,
          title: this.getDomainLabel(domain) + " - Yetersiz Veri",
          description: "Bu alan hakkında yorum yapabilmek için daha fazla oyun verisi gerekiyor.",
          severity: 'low',
          confidence,
        });
        return;
      }

      let baseDescription = '';
      let title = '';
      let targetList: InsightItem[] | null = null;
      let severity: 'low' | 'medium' | 'high' = 'medium';

      if (score >= 80) {
        targetList = strengths;
        severity = 'high';
        switch (domain) {
          case 'attention':
            title = "Dikkatini Koruyabiliyor";
            baseDescription = "Oyunlar sırasında hedefe odaklanma becerisi güçlü görünüyor.";
            break;
          case 'inhibition':
            title = "Düşünerek Hareket Ediyor";
            baseDescription = "Yanıt vermeden önce seçenekleri sakin bir şekilde değerlendirdiği gözlemlendi.";
            break;
          case 'processingSpeed':
            title = "Hızlı Bilgi İşleme";
            baseDescription = "Görsel hedefleri tanıma ve tepki vermede yüksek bir işlem hızına sahip görünüyor.";
            break;
          case 'workingMemory':
            title = "Bilgiyi Aklında Tutabiliyor";
            baseDescription = "Görsel ve mekansal desenleri zihninde tutma ve geri çağırma yeteneği oldukça gelişmiş görünüyor.";
            break;
          case 'planning':
            title = "Planlı ve Stratejik";
            baseDescription = "Karmaşık hedeflere ulaşmak için adımları önceden organize etme becerisi güçlü görünüyor.";
            break;
        }
      } else if (score < 50) {
        targetList = growthAreas;
        severity = 'low';
        switch (domain) {
          case 'attention':
            title = "Dikkat Dalgalanmaları";
            baseDescription = "Bazı görevlerde dikkatini sürdürmekte zorlandığı gözlemlendi.";
            break;
          case 'inhibition':
            title = "Acele Karar Eğilimi";
            baseDescription = "Bazı görevlerde yanıt vermeden önce daha fazla değerlendirme yapması faydalı olabilir.";
            break;
          case 'processingSpeed':
            title = "Daha Temkinli Tempo";
            baseDescription = "Görevleri kendi belirlediği temkinli ve kontrollü bir hızla tamamlamayı tercih ediyor.";
            break;
          case 'workingMemory':
            title = "Bilgiyi Takip Etmekte Zorlanabiliyor";
            baseDescription = "Karmaşık mekansal desenleri takip ederken ek desteğe veya pratik yapmaya ihtiyaç duyabilir.";
            break;
          case 'planning':
            title = "Plan Yapmadan Harekete Geçebiliyor";
            baseDescription = "Hedefe ulaşmak için tasarlanmış rotayı önceden planlamadan eyleme geçme eğilimi gözlemlendi.";
            break;
        }
      } else {
        // Neutral Observations (Score 50-79)
        targetList = observations;
        severity = 'medium';
        switch (domain) {
          case 'attention':
            title = "Dengeli Odaklanma";
            baseDescription = "Dikkatini orta düzeyde sürdürebiliyor, ancak yorulmaya başladığında performansı değişebilir.";
            break;
          case 'inhibition':
            title = "Durumsal Tepki Kontrolü";
            baseDescription = "Genellikle sakin kalabiliyor fakat bazı zorlayıcı anlarda dürtüsel yanıtlar verebiliyor.";
            break;
          case 'processingSpeed':
            title = "Dengeli İşlem Hızı";
            baseDescription = "Tepki süresi ve doğruluğu arasında dengeli bir tempo kurmayı başarıyor.";
            break;
          case 'workingMemory':
            title = "Yeterli Zihinsel Depolama";
            baseDescription = "Kısa süreli görsel bilgileri akılda tutma performansı dengeli bir düzeydedir.";
            break;
          case 'planning':
            title = "Temel Seviye Planlama";
            baseDescription = "Karşılaştığı yollarda planlama adımlarını kısmen kullanabiliyor, pratikle daha verimli hale gelecektir.";
            break;
        }
      }

      // Rule: If confidence is under 40%, append notice
      if (confidence < 0.40) {
        baseDescription += " Bu alan için henüz yeterli oyun verisi bulunmuyor.";
      }

      if (targetList) {
        targetList.push({
          domain,
          title,
          description: baseDescription,
          severity,
          confidence,
        });
      }
    });

    // 2. Process Cross-Domain Insights (added to observations)
    const current = profile.currentScores;
    const attentionConf = profile.confidenceScores.attention;
    const inhibitionConf = profile.confidenceScores.inhibition;
    const speedConf = profile.confidenceScores.processingSpeed;
    const memoryConf = profile.confidenceScores.workingMemory;
    const planningConf = profile.confidenceScores.planning;

    // Cross-Domain 1: Fast but impulsive (Processing Speed > 80 & Inhibition < 50)
    if (current.processingSpeed >= 80 && current.inhibition < 50 && speedConf >= 0.4 && inhibitionConf >= 0.4) {
      observations.push({
        domain: 'inhibition',
        title: "Hızlı Fakat Aceleci Davranış Eğilimi",
        description: "Görsel hedeflere tepki vermede çok hızlı olmakla birlikte, karar verirken aceleci davranarak hata yapma eğilimi gözlemlendi.",
        severity: 'medium',
        confidence: Math.min(speedConf, inhibitionConf),
      });
    }

    // Cross-Domain 2: Strong strategic planning & memory (Planning > 80 & Memory > 80)
    if (current.planning >= 80 && current.workingMemory >= 80 && planningConf >= 0.4 && memoryConf >= 0.4) {
      observations.push({
        domain: 'planning',
        title: "Güçlü Stratejik Düşünme",
        description: "Karmaşık görevlerde strateji geliştirme ve bilgiyi zihinde tutma/takip etme becerileri birlikte güçlü görünüyor.",
        severity: 'high',
        confidence: Math.min(planningConf, memoryConf),
      });
    }

    // Cross-Domain 3: Low attention & low inhibition
    if (current.attention < 50 && current.inhibition < 50 && attentionConf >= 0.4 && inhibitionConf >= 0.4) {
      observations.push({
        domain: 'attention',
        title: "Odaklanma ve Dürtüsel Tepki Eğilimi",
        description: "Dikkat süresinin kısaldığı anlarda acele yanıt verme eğiliminin arttığı gözlemlendi.",
        severity: 'low',
        confidence: Math.min(attentionConf, inhibitionConf),
      });
    }

    // Cross-Domain 4: Slow pace & strong planning (Speed < 50 & Planning > 80)
    if (current.processingSpeed < 50 && current.planning >= 80 && speedConf >= 0.4 && planningConf >= 0.4) {
      observations.push({
        domain: 'planning',
        title: "Analitik ve Temkinli Yaklaşım",
        description: "Yavaş ve temkinli bir tempoda çalışmayı tercih ederken, planlama gerektiren görevlerde son derece stratejik adımlar atıyor.",
        severity: 'high',
        confidence: Math.min(speedConf, planningConf),
      });
    }

    // Cross-Domain 5: Low memory & strong planning (Memory < 50 & Planning > 80)
    if (current.workingMemory < 50 && current.planning >= 80 && memoryConf >= 0.4 && planningConf >= 0.4) {
      observations.push({
        domain: 'planning',
        title: "Planlamayla Desteklenen Bellek",
        description: "Mekansal hafıza görevlerinde zorlanmalar görülürken, adımlarını önceden planlayarak bu açığı stratejiyle kapatma eğilimi gösteriyor.",
        severity: 'high',
        confidence: Math.min(memoryConf, planningConf),
      });
    }

    // 3. Generate Recommendations
    domains.forEach(domain => {
      const score = profile.currentScores[domain];
      const confidence = profile.confidenceScores[domain];

      // Only recommend for domains where we have enough confidence (>= 0.4)
      if (confidence < 0.40) return;

      if (score < 50) {
        switch (domain) {
          case 'attention':
            recommendations.push({
              domain,
              title: "Kısa Hedefli Görevler",
              description: "Evde kısa süreli ve tek hedefli görevlerle (örneğin odaklanma oyunları veya kitap okuma) çalışmak dikkat süresini destekleyebilir.",
            });
            break;
          case 'inhibition':
            recommendations.push({
              domain,
              title: "Bekle ve Düşün Egzersizleri",
              description: "Günlük hayatta yanıt vermeden önce beş saniye bekleme kuralı gibi küçük bekle-düşün egzersizleri dürtü kontrolünü güçlendirebilir.",
            });
            break;
          case 'processingSpeed':
            recommendations.push({
              domain,
              title: "Baskısız Zaman Tanıma",
              description: "Zaman baskısı olmayan ortamlarda görevleri tamamlamasına izin vermek, çocuğun stres düzeyini azaltarak işlem kalitesini artıracaktır.",
            });
            break;
          case 'workingMemory':
            recommendations.push({
              domain,
              title: "Görsel Destekler Kullanma",
              description: "Sözlü yönergeleri görsel kartlar, listeler veya şemalar ile desteklemek bilgiyi zihinde tutma sürecine yardımcı olabilir.",
            });
            break;
          case 'planning':
            recommendations.push({
              domain,
              title: "Küçük Planlama Görevleri",
              description: "Günlük yaşamda küçük planlama görevleri (örneğin oda toplama sırasını belirleme veya çanta hazırlama) vermek karar verme ve organizasyon becerilerini destekleyebilir.",
            });
            break;
        }
      } else if (score >= 80) {
        // Positive enrichment recommendations for strengths
        switch (domain) {
          case 'planning':
            recommendations.push({
              domain,
              title: "Stratejik Oyunlar ile Gelişim",
              description: "Satranç, kutu oyunları veya strateji gerektiren bulmacalar planlama becerilerini daha da ileriye taşıyabilir.",
            });
            break;
          case 'workingMemory':
            recommendations.push({
              domain,
              title: "Zihinsel Egzersizleri Çeşitlendirme",
              description: "Karmaşık desen hatırlama veya kelime oyunları zihinsel kapasiteyi korumaya ve geliştirmeye katkı sağlayabilir.",
            });
            break;
        }
      }
    });

    // 4. Calculate Overall Confidence Summary
    const validConfidences = domains.map(d => profile.confidenceScores[d]);
    const overallConfidence = validConfidences.reduce((sum, val) => sum + val, 0) / domains.length;

    let message = '';
    if (overallConfidence < 0.3) {
      message = "Yetersiz Veri Düzeyi. Çocuğunuzun bilişsel profili hakkında daha güvenilir yorumlar yapabilmek için lütfen daha fazla oyun oynamasını sağlayın.";
    } else if (overallConfidence < 0.6) {
      message = "Kısmi Veri Düzeyi. Bazı alanlarda güçlü gözlemler mevcut, ancak tam bir profil için daha fazla oyun verisine ihtiyaç var.";
    } else {
      message = "Yeterli Veri Düzeyi. Çocuğunuzun bilişsel profili hakkında sunulan analizler yüksek oranda oyun verisine dayanmaktadır.";
    }

    // 5. Generate Overall Narrative Summary Paragraph
    const overallNarrative = this.generateOverallNarrative(profile);

    return {
      strengths,
      growthAreas,
      observations,
      recommendations,
      confidenceSummary: {
        overallConfidence: parseFloat(overallConfidence.toFixed(2)),
        message,
      },
      overallNarrative,
    };
  }

  /**
   * Generates a single introductory summary paragraph based on cognitive strengths, growth areas, and trends.
   */
  public static generateOverallNarrative(profile: CognitiveProfile): string {
    const domains: (keyof CognitiveDomainScores)[] = [
      'attention',
      'inhibition',
      'processingSpeed',
      'workingMemory',
      'planning',
    ];

    const activeDomains = domains.filter(d => profile.confidenceScores[d] >= 0.20);
    const validConfidences = domains.map(d => profile.confidenceScores[d]);
    const overallConfidence = validConfidences.reduce((sum, val) => sum + val, 0) / domains.length;

    // Check low confidence threshold
    if (overallConfidence < 0.30 || activeDomains.length === 0) {
      return "Bu alanlarda daha güvenilir yorumlar oluşturabilmek için biraz daha oyun verisine ihtiyaç vardır. Sistem yeni oturumlar tamamlandıkça gözlemleri daha ayrıntılı hale getirecektir.";
    }

    // Find highest and lowest scoring active domains
    let highestDomain = activeDomains[0];
    let lowestDomain = activeDomains[0];

    activeDomains.forEach(d => {
      if (profile.currentScores[d] > profile.currentScores[highestDomain]) {
        highestDomain = d;
      }
      if (profile.currentScores[d] < profile.currentScores[lowestDomain]) {
        lowestDomain = d;
      }
    });

    // Strength sentence
    let strengthSentence = "";
    switch (highestDomain) {
      case 'attention':
        strengthSentence = "Çocuğunuz oyun etkinliklerinde odaklanma ve dikkatini sürdürme konusunda güçlü bir performans sergilemiştir.";
        break;
      case 'inhibition':
        strengthSentence = "Oyunlar sırasında acele etmeden karar verme, sakin kalma ve seçenekleri süzgeçten geçirme becerisi ön plana çıkmaktadır.";
        break;
      case 'processingSpeed':
        strengthSentence = "Görsel görevlerde hedefleri hızlı tanıma ve tepki vermede yüksek bir işlem hızına sahip olduğu gözlemlenmiştir.";
        break;
      case 'workingMemory':
        strengthSentence = "Görsel ve mekansal desenleri zihninde tutma, takip etme ve başarıyla geri çağırma yeteneği güçlü görünmektedir.";
        break;
      case 'planning':
        strengthSentence = "Adımlarını önceden tasarlayarak stratejik karar verme ve planlı hareket etme becerisi üst seviyededir.";
        break;
    }

    // Growth sentence
    let growthSentence = "";
    if (profile.currentScores[lowestDomain] < 50) {
      switch (lowestDomain) {
        case 'attention':
          growthSentence = "Bununla birlikte, görev süresi uzadığında dikkatini sabit tutmakta zaman zaman dalgalanmalar yaşayabilmektedir.";
          break;
        case 'inhibition':
          growthSentence = "Bununla birlikte, hızlı yanıt verme heyecanına kapılarak bazı durumlarda aceleci davranma eğilimi gösterebilir.";
          break;
        case 'processingSpeed':
          growthSentence = "Bununla birlikte, zaman baskısı olan durumlarda adımlarını daha temkinli ve kontrollü bir hızda atmayı tercih etmektedir.";
          break;
        case 'workingMemory':
          growthSentence = "Bununla birlikte, karmaşık mekansal dizilimleri zihninde koruma aşamasında ek rehberliğe gereksinim duyabilir.";
          break;
        case 'planning':
          growthSentence = "Bununla birlikte, oyun alanlarında rotayı önceden detaylandırmadan doğrudan eyleme geçme alışkanlığı gözlemlenmiştir.";
          break;
      }
    } else {
      growthSentence = "Gelişmekte olan tüm alanlarda dengeli ve uyumlu bir ilerleme seyri izlemektedir.";
    }

    // Trend sentence
    let trendSentence = "";
    const improvingCount = domains.filter(d => profile.trends[d] === 'improving').length;
    const decliningCount = domains.filter(d => profile.trends[d] === 'declining').length;

    if (improvingCount >= 2) {
      trendSentence = "Son oturumlarda gösterdiği performans gelişimi, becerilerinin kararlı bir şekilde yükseldiğini göstermektedir.";
    } else if (decliningCount >= 1) {
      trendSentence = "Performansta görülen küçük duraksamalar yorgunluk ve motivasyon gibi günlük etkenlere bağlı gelişmiş olabilir.";
    } else {
      trendSentence = "Bilişsel becerilerindeki kararlılık, öğrenme ve uygulama süreçlerinde istikrarlı gittiğini doğrulamaktadır.";
    }

    return `${strengthSentence} ${growthSentence} ${trendSentence}`;
  }

  private static getDomainLabel(domain: string): string {
    switch (domain) {
      case 'attention': return 'Dikkat';
      case 'inhibition': return 'Dürtü Kontrolü';
      case 'processingSpeed': return 'İşlem Hızı';
      case 'workingMemory': return 'Çalışan Bellek';
      case 'planning': return 'Planlama';
      default: return domain;
    }
  }
}
