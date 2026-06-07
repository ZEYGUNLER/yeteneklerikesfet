# Cognitive Scoring Engine Specification

## 1. Mathematical Normalization Framework

To model human performance psychometrically, the engine uses **Sigmoid (Logistic) Normalization** and **Exponential Decay Normalization**. This ensures that improvements near physiological limits are appropriately rewarded, and performance decreases decay gracefully.

### 1.1. Sigmoid Normalization (Direct Metrics)
For metrics where a higher value is better (e.g., span, accuracy, efficiency):
$$S(x) = \frac{100}{1 + e^{-k \cdot (x - x_0)}}$$
Where:
- $x$: The raw metric value.
- $x_0$: The midpoint (median expected performance).
- $k$: The steepness parameter controlling sensitivity around the midpoint.

### 1.2. Sigmoid Normalization (Inverse Metrics)
For metrics where a lower value is better (e.g., reaction times, error counts):
$$S_{inv}(x) = \frac{100}{1 + e^{k \cdot (x - x_0)}}$$

---

## 2. Eliminate Last Session Bias via Weighted Rolling Average

To prevent excessive sensitivity to a single atypical play session, all domain scores are computed using a weighted rolling average of the most recent 5 sessions.

If fewer than 5 sessions are available, the weights for the available sessions are normalized to sum to 1.0.

### Weights for 5 Sessions:
- **s1 (Latest session)**: 40% (0.40)
- **s2 (Previous session)**: 25% (0.25)
- **s3 (2 sessions ago)**: 15% (0.15)
- **s4 (3 sessions ago)**: 10% (0.10)
- **s5 (4 sessions ago)**: 10% (0.10)

$$\text{weightedScore} = \sum_{i=1}^{N} s_i \cdot w_i^{\text{normalized}}$$

---

## 3. Weighted Domain Mapping & Multi-Game Ingestion

Each cognitive domain is calculated using a weighted combination of normalized metrics, pulling data across multiple games.

### 3.1. Attention (Dikkat)
- **Dikkat Ormanı `attentionScore`** (Weight: 0.5)
- **Dikkat Ormanı `attentionRecoveryRate`** (Weight: 0.25)
- **Yıldırım Kulesi `missedStimuliRate`** (Weight: 0.25) (Normalized via Inverse Sigmoid)

### 3.2. Inhibition (Dürtü Kontrolü)
- **Dikkat Ormanı `inhibitionScore`** (Weight: 0.4)
- **Yıldırım Kulesi `falseStartsRate`** (Weight: 0.3)
- **Yıldırım Kulesi `distractorTapsRate`** (Weight: 0.15)
- **Hazine Haritası `impulsiveStartsRate`** (Weight: 0.15)

### 3.3. Processing Speed (İşlem Hızı)
- **Yıldırım Kulesi `reactionTimeMedian`** (Weight: 0.5)
- **Dikkat Ormanı `avgReactionTime`** (Weight: 0.25)
- **Kristal Tapınak `avgHesitationInterval`** (Weight: 0.15)
- **Hazine Haritası `avgDecisionTime`** (Weight: 0.10)

### 3.4. Working Memory (Çalışan Bellek)
- **Kristal Tapınak `maxSpanReached`** (Weight: 0.6) (Sigmoid normalized: $x_0=5, k=1$)
- **Kristal Tapınak `retrievalAccuracy`** (Weight: 0.4)

### 3.5. Planning (Planlama & Yürütücü İşlev)
- **Hazine Haritası `planningScore`** (Weight: 0.40)
- **Hazine Haritası `efficiencyScore`** (Weight: 0.25)
- **Hazine Haritası `deadEndsVisited`** (Weight: 0.20) (Normalized via Inverse Sigmoid)
- **Hazine Haritası `replanningEvents`** (Weight: 0.15) (Normalized via Inverse Sigmoid)

---

## 4. Strengthened Confidence Layer

To prevent extremely short or sparse play sessions from skewing scores, confidence is evaluated based on session counts, rounds completed, and total play duration.

### Evidence Thresholds (Target for 1.0 Confidence):
- **Sessions**: $\ge 3$ sessions
- **Play Exposure**: $\ge 15$ minutes (900 seconds)
- **Target Rounds**: Based on the game's default length multiplied by 3.

### Formula:
$$\text{Confidence} = (0.4 \cdot \text{SessionFactor}) + (0.4 \cdot \text{DurationFactor}) + (0.2 \cdot \text{RoundsFactor})$$

---

## 5. Relative Performance Level (Göreceli Düzey)

Instead of using the term "Percentile" (which requires a large population normative database), the system outputs **Göreceli Düzey (Relative Performance Level)**:
- **Score $\ge 90$**: Elite Level (Üst Düzey)
- **Score $\ge 75$**: Advanced Level (İleri Düzey)
- **Score $\ge 50$**: Competent Level (Orta Düzey)
- **Score $\ge 30$**: Developing Level (Gelişmekte Olan)
- **Score $< 30$**: Beginner Level (Başlangıç Seviyesi)

---

## 6. Fatigue Resistance Engine Default Fallback

To avoid treating "no data" as perfect fatigue resistance:
- The Fatigue Engine defaults to a neutral score of **50**.
- The output fatigue score is confidence-adjusted:
$$\text{FatigueScore}_{\text{final}} = (\text{CalculatedScore} \cdot \text{Confidence}) + (50 \cdot (1 - \text{Confidence}))$$
