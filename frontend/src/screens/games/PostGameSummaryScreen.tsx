import { useLocalSearchParams, router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { navigationService } from '@/navigation/navigation.service';
import { RewardCeremony } from '@/components/progression/RewardCeremony';
import { ACHIEVEMENTS, UNLOCKABLES } from '@/config/unlockables.config';
import { ROUTES } from '@/navigation/routes';
import { useState, useEffect, useRef } from 'react';

function toNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

// Durations within hard limits:
// scorePopDuration = 350ms (celebratory, max 800ms)
// statCardDuration = 250ms (microinteraction, 120–350ms)
// confettiDuration = 600ms (celebratory, max 800ms)
const SCORE_POP_DURATION = 350;
const STAT_STAGGER = 80;
const STAT_DURATION = 220;
const CONFETTI_DURATION = 600;

export function PostGameSummaryScreen() {
  const params = useLocalSearchParams<{
    totalCorrect?: string;
    longestSequence?: string;
    starsEarned?: string;
    earnedXP?: string;
    leveledUp?: string;
    newAchievements?: string;
    newUnlocks?: string;
    gameType?: string;
    attentionScore?: string;
    inhibitionScore?: string;
    avgReactionTime?: string;
    bestStreak?: string;
  }>();

  const totalCorrect = toNumber(params.totalCorrect);
  const longestSequence = toNumber(params.longestSequence);
  const starsEarned = toNumber(params.starsEarned);
  const earnedXP = toNumber(params.earnedXP);
  const gameType = params.gameType ?? 'memory';
  const attentionScore = toNumber(params.attentionScore);
  const inhibitionScore = toNumber(params.inhibitionScore);
  const avgReactionTime = toNumber(params.avgReactionTime);
  const bestStreak = toNumber(params.bestStreak);

  const isAttention = gameType === 'attention';

  // ── Animation refs (useRef, never useState — Rule 3) ──
  const scoreScale = useRef(new Animated.Value(0.4)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;
  // 3 stat cards
  const statAnims = useRef([0, 1, 2].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(12),
  }))).current;
  // 3 confetti emojis — Rule 2: soft fade only, no movement animation
  const confettiAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // 1. Header slides in (250ms — microinteraction)
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    // 2. Score circle pops in with spring (celebratory — within 350ms hard cap)
    Animated.spring(scoreScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // 3. Confetti emojis fade in with 80ms stagger (soft, no movement — Rule 2)
    confettiAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: CONFETTI_DURATION,
        delay: i * 100,
        useNativeDriver: true,
      }).start();
    });

    // 4. Stat cards stagger in (220ms each, 80ms apart)
    statAnims.forEach(({ opacity, translateY }, i) => {
      const delay = 200 + i * STAT_STAGGER;
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: STAT_DURATION, delay, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: STAT_DURATION, delay, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const [ceremonyQueue, setCeremonyQueue] = useState<any[]>([]);
  const [currentCeremony, setCurrentCeremony] = useState<any>(null);

  useEffect(() => {
    const queue: any[] = [];
    if (params.leveledUp === '1') {
      queue.push({ type: 'level_up', title: 'Seviye Atladın!', subtitle: 'Artık daha güçlüsün!' });
    }
    if (params.newAchievements) {
      params.newAchievements.split(',').forEach(id => {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) queue.push({ type: 'achievement', title: ach.name, subtitle: ach.description, icon: ach.icon });
      });
    }
    if (params.newUnlocks) {
      params.newUnlocks.split(',').forEach(id => {
        const unlock = UNLOCKABLES.find(u => u.id === id);
        if (unlock) queue.push({ type: 'unlock', title: 'Yeni Eşya!', subtitle: unlock.name });
      });
    }
    if (queue.length > 0) {
      setCeremonyQueue(queue);
      setCurrentCeremony(queue[0]);
    }
  }, []);

  const handleNextCeremony = () => {
    const nextQueue = ceremonyQueue.slice(1);
    setCeremonyQueue(nextQueue);
    setCurrentCeremony(nextQueue.length > 0 ? nextQueue[0] : null);
  };

  const confettiEmojis = isAttention ? ['🦉', '✨', '🦉'] : ['🌟', '✨', '🌟'];

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>

      {/* ── Celebration Header ── */}
      <Animated.View style={[styles.celebration, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
        <View style={styles.confettiRow}>
          {confettiEmojis.map((emoji, i) => (
            <Animated.Text key={i} style={[styles.confettiEmoji, { opacity: confettiAnims[i] }]}>
              {emoji}
            </Animated.Text>
          ))}
        </View>
        <Text style={styles.title}>{isAttention ? 'Dikkat Kulesi\'ni Tamamladın!' : 'Harika İş Çıkardın!'}</Text>
        <Text style={styles.subtitle}>{isAttention ? 'Odaklandın, başardın!' : 'Bölümü başarıyla tamamladın.'}</Text>
      </Animated.View>

      {/* ── Stars Display ── */}
      <Animated.View style={[styles.scoreCircle, { transform: [{ scale: scoreScale }] }]}>
        <View style={styles.scoreInner}>
          <Text style={styles.scoreLabel}>YILDIZLAR</Text>
          <Text style={styles.starsValue}>
            {Array(starsEarned).fill('⭐').join('')}
            {Array(3 - starsEarned).fill('☆').join('')}
          </Text>
        </View>
      </Animated.View>

      {/* ── Stat Cards (staggered entrance) ── */}
      <View style={styles.statsGrid}>
        {(isAttention ? [
          { emoji: '🎯', value: `${attentionScore}%`, label: 'Dikkat Skoru' },
          { emoji: '🛡️', value: `${inhibitionScore}%`, label: 'Dürtü Kontrolü' },
          { emoji: '🏆', value: `${bestStreak}`, label: 'En İyi Seri' },
        ] : [
          { emoji: '🎯', value: `${totalCorrect}`, label: 'Toplam Doğru' },
          { emoji: '🧠', value: `${longestSequence}`, label: 'En Uzun Sekans' },
          { emoji: '🏆', value: `3`, label: 'Dünya Tamamlandı' },
        ]).map((stat, i) => (
          <Animated.View
            key={stat.label}
            style={[
              styles.statCard,
              { opacity: statAnims[i].opacity, transform: [{ translateY: statAnims[i].translateY }] },
            ]}
          >
            <Text style={styles.statEmoji}>{stat.emoji}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>

      {currentCeremony && (
        <RewardCeremony
          type={currentCeremony.type}
          title={currentCeremony.title}
          subtitle={currentCeremony.subtitle}
          icon={currentCeremony.icon}
          onClose={handleNextCeremony}
        />
      )}

      {/* ── Reward Moment ── */}
      <View style={styles.rewardCard}>
        <Text style={styles.rewardIcon}>🎁</Text>
        <View style={styles.rewardContent}>
          <Text style={styles.rewardTitle}>Yeni Bir Yıldız Kazandın!</Text>
          <Text style={styles.rewardText}>Harika odaklandın, böyle devam et.</Text>
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => navigationService.goToGamePlay(gameType)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        >
          <Text style={styles.primaryBtnText}>Tekrar Oyna</Text>
        </Pressable>

        <Pressable
          onPress={() => navigationService.goToGames()}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
        >
          <Text style={styles.secondaryBtnText}>Ana Menüye Dön</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}


const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 32,
    alignItems: 'center',
  },
  celebration: {
    alignItems: 'center',
    gap: 8,
  },
  confettiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  confettiEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  scoreCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 3,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  scoreInner: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#A5B4FC',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  starsValue: {
    fontSize: 48,
    marginTop: 8,
    color: '#FBBF24',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 400,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F1F5F9',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    width: '100%',
    maxWidth: 400,
  },
  rewardIcon: {
    fontSize: 36,
  },
  rewardContent: {
    flex: 1,
    gap: 2,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F59E0B',
  },
  rewardText: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  secondaryBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnPressed: {
    opacity: 0.5,
  },
  secondaryBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 16,
  },
});

