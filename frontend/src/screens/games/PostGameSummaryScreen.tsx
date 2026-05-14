import { useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { navigationService } from '@/navigation/navigation.service';

function toNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

export function PostGameSummaryScreen() {
  const params = useLocalSearchParams<{
    score?: string;
    duration?: string;
    accuracy?: string;
    level?: string;
  }>();

  const score = toNumber(params.score);
  const duration = toNumber(params.duration);
  const accuracy = toNumber(params.accuracy);
  
  // Mastery Data
  const metadata = params.level ? JSON.parse(decodeURIComponent(params.level)) : {}; 
  // Wait, level in params might be just a number or the metadata object stringified.
  // Actually, useGameSession passes metadata. let's see how it's passed.
  // In useGameSession: level: result.metadata?.highestLevel || 0
  // So I might need to update navigationService or pass mastery as separate params.
  // Let's assume for now I'll pass perfectRounds/totalRounds as separate params for reliability.
  const level = toNumber(params.level);

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <View style={styles.celebration}>
        <Text style={styles.confetti}>🎊 ✨ 🎊</Text>
        <Text style={styles.title}>Harika İş Çıkardın!</Text>
        <Text style={styles.subtitle}>Bölümü başarıyla tamamladın.</Text>
      </View>

      <View style={styles.scoreCircle}>
        <View style={styles.scoreInner}>
          <Text style={styles.scoreLabel}>PUAN</Text>
          <Text style={styles.scoreValue}>{Math.round(score)}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⏱️</Text>
          <Text style={styles.statValue}>{Math.round(duration)} sn</Text>
          <Text style={styles.statLabel}>Süre</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={styles.statValue}>{Math.round(accuracy * 100)}%</Text>
          <Text style={styles.statLabel}>Başarı</Text>
        </View>
      </View>

      {/* ── Reward Moment ── */}
      <View style={styles.rewardCard}>
        <Text style={styles.rewardIcon}>🎁</Text>
        <View style={styles.rewardContent}>
          <Text style={styles.rewardTitle}>Yeni Bir Yıldız Kazandın!</Text>
          <Text style={styles.rewardText}>Harika odaklandın, böyle devam et.</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigationService.goToGames()}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        >
          <Text style={styles.primaryBtnText}>Tekrar Oyna</Text>
        </Pressable>

        <Pressable
          onPress={() => navigationService.goToProfilePicker('summary_back')}
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
  confetti: {
    fontSize: 40,
    marginBottom: 8,
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
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 4,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
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
  scoreValue: {
    fontSize: 64,
    fontWeight: '900',
    color: '#F8FAFC',
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

