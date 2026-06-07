import { CognitiveProfile, CognitiveDomainScores } from './cognitiveScoringEngine';
import { LongitudinalReport, DevelopmentDirection } from './longitudinalAnalysisEngine';

export type RecommendationCategory = 'game' | 'home_activity' | 'daily_routine' | 'session';
export type RecommendationType = 'growth' | 'strength_reinforcement';
export type RecommendationConfidence = 'low' | 'medium' | 'high';
export type RecommendationPriority = 'low' | 'medium' | 'high';

export interface AdaptiveRecommendationItem {
  id: string;
  category: RecommendationCategory;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  rationale: string;
  recommendationConfidence: RecommendationConfidence;

  // Fatigue Prevention
  lastShownAt?: string;
  timesShown?: number;
}

export interface AdaptiveRecommendationReport {
  recommendations: AdaptiveRecommendationItem[];
  generatedAt: Date;
}

export class AdaptiveRecommendationEngine {
  /**
   * Generates actionable next-step recommendations based on cognitive profile and longitudinal trend.
   */
  public static generateRecommendations(
    profile: CognitiveProfile,
    longitudinal: LongitudinalReport | null
  ): AdaptiveRecommendationReport {
    const recommendations: AdaptiveRecommendationItem[] = [];

    // 1. Generate Domain-Specific Diversity Recommendations
    const domains: (keyof CognitiveDomainScores)[] = ['attention', 'inhibition', 'processingSpeed', 'workingMemory', 'planning'];

    domains.forEach(domain => {
      // Do not generate recommendations for domains that are not AI eligible (e.g. proxy planning)
      if (!profile.aiEligibility[domain]) return;

      const score = profile.currentScores[domain];
      const conf = profile.confidenceScores[domain];
      const trend = longitudinal?.[domain]?.direction || 'stable';

      // Minimum confidence to generate domain-specific recommendation
      if (conf < 0.3) return;

      const recConf = this.mapConfidence(conf);
      const priority = this.calculatePriority(score, trend, recConf);

      if (score < 50) {
        // Growth Recommendations
        recommendations.push(...this.generateDiversityTriplet(domain, 'growth', recConf, priority, trend));
      } else if (score >= 80) {
        // Strength Reinforcement Recommendations
        recommendations.push(...this.generateDiversityTriplet(domain, 'strength_reinforcement', recConf, priority, trend));
      }
    });

    // 2. Generate Cross-Domain Recommendations
    const crossDomainRecs = this.evaluateCrossDomainRules(profile);
    recommendations.push(...crossDomainRecs);

    // 3. Generate Session Recommendations
    const sessionRec = this.generateSessionRecommendation(profile, longitudinal);
    if (sessionRec) {
      recommendations.push(sessionRec);
    }

    return {
      recommendations,
      generatedAt: new Date(),
    };
  }

  private static mapConfidence(score: number): RecommendationConfidence {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private static calculatePriority(score: number, trend: DevelopmentDirection, conf: RecommendationConfidence): RecommendationPriority {
    if (conf === 'low') return 'low';
    
    // Growth priorities
    if (score < 50) {
      if (trend === 'declining') return 'high';
      return 'medium';
    }
    
    // Strength priorities
    if (score >= 80) {
      return 'medium';
    }

    return 'low';
  }

  private static generateDiversityTriplet(
    domain: keyof CognitiveDomainScores,
    type: RecommendationType,
    conf: RecommendationConfidence,
    priority: RecommendationPriority,
    trend: DevelopmentDirection
  ): AdaptiveRecommendationItem[] {
    const items: AdaptiveRecommendationItem[] = [];
    const domainName = this.getDomainTurkishName(domain);

    let rationale = '';
    if (type === 'growth') {
      rationale = `Bu öneri, ${domainName} alanında gözlemlenen gelişim fırsatlarını desteklemek amacıyla oluşturulmuştur.`;
      if (trend === 'declining') rationale += ' Son dönemdeki dalgalanmalar bu alanı öncelikli kılmaktadır.';
    } else {
      rationale = `Bu öneri, ${domainName} alanındaki belirgin güçlülüğü korumak ve bu potansiyeli daha da pekiştirmek için oluşturulmuştur.`;
      if (trend === 'plateau') rationale += ' Yerleşmiş becerileri yeni uyaranlarla canlı tutmak hedeflenmektedir.';
    }

    if (domain === 'workingMemory') {
      if (type === 'growth') {
        items.push({ id: `gm_wm_g`, category: 'game', type, title: 'Kristal Tapınak', description: 'Görsel ve mekansal hafızayı güçlendiren Kristal Tapınak oyununa düzenli olarak yer verin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `ha_wm_g`, category: 'home_activity', type, title: 'Hikaye Canlandırma', description: 'Okuduğunuz bir kitabın olay örgüsünü detaylarıyla zihninde canlandırarak size geri anlatmasını isteyin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `dr_wm_g`, category: 'daily_routine', type, title: 'Üç Adımlı Yönergeler', description: 'Günlük işlerde "Önce ellerini yıka, sonra kitabını al ve koltuğa otur" gibi çoklu yönergeler verin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      } else {
        items.push({ id: `gm_wm_s`, category: 'game', type, title: 'Kristal Tapınak (İleri Seviye)', description: 'Güçlü hafıza becerilerini zorlamak için Kristal Tapınak oyununda karmaşık rotalara odaklanın.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `ha_wm_s`, category: 'home_activity', type, title: 'Hafıza Oyunları Kurma', description: 'Kendisi kuralları olan ve nesnelerin yerlerini akılda tutmayı gerektiren kutu oyunları tasarlayabilir.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      }
    } else if (domain === 'planning') {
      if (type === 'growth') {
        items.push({ id: `gm_pl_g`, category: 'game', type, title: 'Hazine Haritası', description: 'Strateji oluşturma becerilerini destekleyen Hazine Haritası oyununu deneyin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `ha_pl_g`, category: 'home_activity', type, title: 'Labirent Tasarımı', description: 'Kağıt üzerinde veya evdeki eşyalarla bir labirent tasarlayıp çözüm rotasını baştan çizmesini isteyin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `dr_pl_g`, category: 'daily_routine', type, title: 'Okul Çantası Organizasyonu', description: 'Ertesi günün planını yaparak çantasını sırayla ve düşünerek hazırlaması için alan açın.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      } else {
        items.push({ id: `gm_pl_s`, category: 'game', type, title: 'Hazine Haritası (Strateji Ustası)', description: 'Güçlü stratejik becerilerini kullanarak Hazine Haritası oyununda en az hamle ile hedefe ulaşmayı hedeflesin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `ha_pl_s`, category: 'home_activity', type, title: 'Proje Yöneticisi', description: 'Hafta sonu aile etkinliğini baştan sona planlayıp yönetmesine izin verin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      }
    } else if (domain === 'attention') {
      if (type === 'growth') {
        items.push({ id: `gm_at_g`, category: 'game', type, title: 'Dikkat Kulesi', description: 'Odak süresini artırmaya yardımcı olan Dikkat Kulesi oyununa öncelik verin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `dr_at_g`, category: 'daily_routine', type, title: 'Tek Odaklı Zaman', description: 'Yemek yerken veya ders çalışırken ekran/müzik gibi tüm çeldiricileri ortadan kaldırın.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `ha_at_g`, category: 'home_activity', type, title: 'Görsel Avı', description: 'Bir resimde saklı olan belirli nesneleri bulma etkinlikleri yapın.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      } else {
        items.push({ id: `gm_at_s`, category: 'game', type, title: 'Dikkat Kulesi (Kesintisiz Seri)', description: 'Odaklanma başarısını sürdürmesi için oyunlarda kesintisiz uzun seriler yapmasını teşvik edin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `ha_at_s`, category: 'home_activity', type, title: 'Uzun Süreli Projeler', description: 'Maket yapımı veya 500+ parçalı puzzle gibi uzun süreli odaklanma gerektiren hobiler edindirin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      }
    } else if (domain === 'inhibition') {
       if (type === 'growth') {
        items.push({ id: `gm_in_g`, category: 'game', type, title: 'Dikkat Kulesi (Kontrol Pratiği)', description: 'Gereksiz tepkileri durdurma becerisini geliştiren Dikkat Kulesi oyununa odaklanın.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `ha_in_g`, category: 'home_activity', type, title: 'Dur-Kalk Oyunları', description: 'Müzik eşliğinde dans edip müzik durduğunda hareketsiz kalma (heykel) oyunları oynayın.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `dr_in_g`, category: 'daily_routine', type, title: 'Beş Saniye Kuralı', description: 'Sorulara yanıt vermeden önce içinden beşe kadar sayıp derin bir nefes almasını alışkanlık haline getirin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      } else {
        items.push({ id: `ha_in_s`, category: 'home_activity', type, title: 'Stratejik Karar Oyunları', description: 'Satranç gibi hamle yapmadan önce sakin kalmayı ve rakibi beklemeyi gerektiren oyunları sürdürün.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      }
    } else if (domain === 'processingSpeed') {
       if (type === 'growth') {
        items.push({ id: `dr_ps_g`, category: 'daily_routine', type, title: 'Baskısız Serbest Zaman', description: 'Zaman baskısı olan durumlarda tempoyu çocuğunuzun belirlemesine izin vererek kaygıyı azaltın.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
        items.push({ id: `ha_ps_g`, category: 'home_activity', type, title: 'Ritmi Yakalama', description: 'Birlikte ritim tutma veya eş zamanlı alkış oyunları oynayarak tepki doğallığını destekleyin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      } else {
        items.push({ id: `ha_ps_s`, category: 'home_activity', type, title: 'Hızlı Eşleştirme Oyunları', description: 'Kart eşleştirme oyunlarında saniye tutarak kendi rekorunu kırması için motive edin.', priority, rationale, recommendationConfidence: conf, timesShown: 0 });
      }
    }

    return items;
  }

  private static evaluateCrossDomainRules(profile: CognitiveProfile): AdaptiveRecommendationItem[] {
    const items: AdaptiveRecommendationItem[] = [];
    const p = profile.currentScores;

    const memConf = this.mapConfidence(profile.confidenceScores.workingMemory);
    const planConf = this.mapConfidence(profile.confidenceScores.planning);
    const inhibConf = this.mapConfidence(profile.confidenceScores.inhibition);
    const speedConf = this.mapConfidence(profile.confidenceScores.processingSpeed);

    // Rule 1: High Planning + Low Memory
    if (profile.aiEligibility.planning && p.planning >= 75 && p.workingMemory < 50 && planConf !== 'low' && memConf !== 'low') {
      items.push({
        id: `cross_pl_wm`,
        category: 'game',
        type: 'growth',
        title: 'Hazine Haritası + Kristal Tapınak',
        description: 'Çocuğunuz strateji geliştirmede güçlü ancak bilgiyi akılda tutarken zorlanabiliyor. Önce Kristal Tapınak ile hafızayı ısıtıp ardından Hazine Haritası oynamak iyi bir kombinasyon olabilir.',
        priority: 'high',
        rationale: 'Bu öneri, planlama alanındaki gücün, çalışan bellek alanındaki gelişim fırsatını desteklemesi amacıyla oluşturulmuştur.',
        recommendationConfidence: memConf,
        timesShown: 0
      });
    }

    // Rule 2: Fast & Impulsive (High Speed + Low Inhibition)
    if (p.processingSpeed >= 75 && p.inhibition < 50 && speedConf !== 'low' && inhibConf !== 'low') {
      items.push({
        id: `cross_ps_in`,
        category: 'home_activity',
        type: 'growth',
        title: 'Yavaşlatıcı Etkinlikler',
        description: 'Çok hızlı hareket ediyor ancak bu hız aceleci kararlar getirebiliyor. Sakinleştirici nefes egzersizleri ve yavaş tempolu denge oyunları (örneğin jenga) oynamak dengeyi sağlayabilir.',
        priority: 'high',
        rationale: 'Bu öneri, işlem hızındaki yüksek potansiyelin dürtüsel davranışları tetikleme eğilimini dengelemek amacıyla oluşturulmuştur.',
        recommendationConfidence: inhibConf,
        timesShown: 0
      });
    }

    return items;
  }

  private static generateSessionRecommendation(profile: CognitiveProfile, longitudinal: LongitudinalReport | null): AdaptiveRecommendationItem | null {
    const fatigue = profile.metaMetrics.fatigueResistance;
    const overallConf = this.mapConfidence(
      (profile.confidenceScores.attention + profile.confidenceScores.processingSpeed + profile.confidenceScores.workingMemory) / 3
    );

    if (overallConf === 'low') {
      return {
        id: `sess_low_data`,
        category: 'session',
        type: 'growth',
        title: 'Veri Kalitesini Artırmak İçin Düzenli Oyun',
        description: 'Platformun daha güvenilir içgörüler sunabilmesi için haftada 3 gün, 10-15 dakikalık oturumlar planlanmalıdır.',
        priority: 'high',
        rationale: 'Bu öneri, sistemde çocuğunuza dair tam bir profil oluşturacak kadar veri bulunmamasına dayanmaktadır.',
        recommendationConfidence: 'high',
        timesShown: 0
      };
    }

    if (fatigue < 50) {
      return {
        id: `sess_high_fatigue`,
        category: 'session',
        type: 'growth',
        title: 'Kısa ve Sık Oturumlar',
        description: 'Çocuğunuzun bilişsel yorulma eşiği hassas görünüyor. Uzun oturumlar yerine haftada 4 gün, maksimum 10 dakikalık çok kısa oturumlar planlayın.',
        priority: 'high',
        rationale: 'Bu öneri, oyun içi davranışlarda gözlemlenen hızlı bilişsel yorulma bulgularına dayanarak oluşturulmuştur.',
        recommendationConfidence: overallConf,
        timesShown: 0
      };
    }

    // Default healthy session pattern based on longitudinal state
    let desc = 'Haftada 3 gün, 15-20 dakikalık düzenli oyun seansları mevcut gelişimi en iyi şekilde destekleyecektir.';
    let rationaleText = 'Bu öneri, genel oyun performansı ve dayanıklılığının sağlıklı bir seviyede olmasına dayanmaktadır.';
    
    // Check if majority plateau
    if (longitudinal) {
      let plateauCount = 0;
      let improvingCount = 0;
      const domains: (keyof CognitiveDomainScores)[] = ['attention', 'inhibition', 'processingSpeed', 'workingMemory', 'planning'];
      domains.forEach(d => {
        if (longitudinal[d].direction === 'plateau') plateauCount++;
        if (longitudinal[d].direction === 'improving') improvingCount++;
      });

      if (plateauCount >= 2) {
        desc = 'Haftada 2-3 gün oynarken, daha az tercih ettiği farklı oyun türlerine (kombinasyonlara) ağırlık verin.';
        rationaleText = 'Bu öneri, mevcut becerilerin yerleşmiş (plato) bir aşamaya gelmesi ve yeni uyaran ihtiyacı doğmasına dayanmaktadır.';
      } else if (improvingCount >= 2) {
        desc = 'Haftada 3 gün, 15 dakikalık oyun düzenine devam edin. Mevcut gelişim eğilimi başarıyla korunuyor.';
        rationaleText = 'Bu öneri, son dönemde gözlenen istikrarlı gelişim eğiliminin bozulmadan desteklenmesi amacına dayanmaktadır.';
      }
    }

    return {
      id: `sess_balanced`,
      category: 'session',
      type: 'strength_reinforcement',
      title: 'Dengeli Gelişim Rutini',
      description: desc,
      priority: 'medium',
      rationale: rationaleText,
      recommendationConfidence: overallConf,
      timesShown: 0
    };
  }

  private static getDomainTurkishName(domain: keyof CognitiveDomainScores): string {
    switch (domain) {
      case 'attention': return 'Dikkat';
      case 'inhibition': return 'Dürtü Kontrolü';
      case 'processingSpeed': return 'İşlem Hızı';
      case 'workingMemory': return 'Çalışan Bellek';
      case 'planning': return 'Planlama';
    }
  }
}
