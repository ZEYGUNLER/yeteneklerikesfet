# Analytics Audit

## Overview
This document outlines the findings of the analytics and metadata audit across the four core games in the "Yeteneklerini Keşfet" platform:
1. **Yıldırım Kulesi (ReactionGameScreen)** - *Processing Speed*
2. **Dikkat Ormanı 2.0 (AttentionGameScreen)** - *Attention & Inhibition*
3. **Kristal Tapınak 2.0 (PatternMemoryScreen)** - *Spatial Working Memory*
4. **Hazine Haritası (MemoryGameScreen / Planning)** - *Planning & Executive Function*

## 1. Existing Metadata Structures

### Yıldırım Kulesi
- **Metrics**: `reactionTimeMedian`, `reactionTimeVariance`, `falseStarts`, `distractorTaps`, `anticipationResponses`, `lateResponses`, `correctResponses`, `missedStimuli`, `fatigueSlope`, `consistencyScore`
- **Progression**: `watcherTitle`, `crystals` (speed, patience, focus)
- **Score Format**: Raw `score` based on `correct * 100`, plus raw millisecond/count metrics.

### Dikkat Ormanı 2.0
- **Metrics**: `hits`, `misses`, `falseAlarms`, `correctRejections`, `attentionScore`, `inhibitionScore`, `impulsivityScore`, `avgReactionTime`, `attentionRecoveryRate`, `bestStreak`
- **Progression**: `starsEarned`
- **Score Format**: Normalized 0-100 percentages (`attentionScore`, `inhibitionScore`).

### Kristal Tapınak 2.0
- **Metrics**: `maxSpanReached`, `correctSequences`, `incorrectSequences`, `partialSuccessRatio`, `retrievalAccuracy`, `sequenceLengthHistory`, `avgSpatialDistanceError`, `maxSpatialDistanceError`, `avgHesitationInterval`, `maxHesitationInterval`, `hesitationVariance`, `worldAccuracy`, `fatigueSlope` (hardcoded to 0), `consistencyScore`
- **Progression**: `watcherTitle`, `crystals` (memory, patience, focus)
- **Score Format**: Raw accuracy and distances.

### Hazine Haritası
- **Metrics**: `optimalPathLength`, `actualPathLength`, `efficiencyScore`, `deadEndsVisited`, `replanningEvents`, `impulsiveStarts`, `avgDecisionTime`, `planningScore`
- **Progression**: `starsEarned`
- **Score Format**: Normalized `planningScore` (0-100) and `efficiencyScore` (ratio).

---

## 2. Identified Issues & Inconsistencies

### Duplicated / Overlapping Metrics
- **Reaction Times**: Measured as `reactionTimeMedian` (Yıldırım Kulesi), `avgReactionTime` (Dikkat Ormanı), `avgHesitationInterval` (Kristal Tapınak), and `avgDecisionTime` (Hazine Haritası). These should be unified under a standardized `timingMetrics` object.
- **Consistency**: `consistencyScore` exists in both Yıldırım Kulesi and Kristal Tapınak, but one uses reaction time variance and the other uses hesitation interval variance.

### Incompatible Naming & Progression Systems
- **Progression Rewards**: Yıldırım Kulesi and Kristal Tapınak output `watcherTitle` and a detailed `crystals` object (`{ speed/memory, patience, focus }`). Dikkat Ormanı and Hazine Haritası output a simpler `starsEarned` (0-3). 
- **Fatigue Tracking**: `fatigueSlope` is correctly computed via linear regression in Yıldırım Kulesi but is a hardcoded `0` placeholder in Kristal Tapınak. It is entirely missing from Dikkat Ormanı, where it is highly relevant.
- **Inhibition/Patience**: Tracked as `patience` crystal in two games, `inhibitionScore` in another, and `impulsiveStarts` in the last.

### Missing Metrics
- **Standardized Percentiles**: None of the payloads prepare data for normative percentiles.
- **Unified Normalized Scores**: Dikkat Ormanı provides clean `attentionScore` (0-100), but Yıldırım Kulesi only provides raw medians.

---

## 3. Normalization Opportunities
By mapping these disparate raw game metrics to standard psychological constructs (Cognitive Domains), we can decouple the "games" from the "report card". 
- Instead of tracking `distractorTaps`, `falseAlarms`, and `impulsiveStarts` separately on the dashboard, they can all inverse-contribute to a unified **Inhibition (Dürtü Kontrolü)** score.
- Instead of comparing `reactionTimeMedian` to `avgDecisionTime`, we can normalize them into a **Processing Speed (İşlem Hızı)** index.
