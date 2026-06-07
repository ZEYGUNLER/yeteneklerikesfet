import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { GameCard } from '@/components/games/GameCard';
import { GAMES } from '@/services/game.service';
import { useChildContext } from '@/context/ChildContext';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AVATARS } from '@/components/profiles/AvatarPicker';
import { ParentGateModal } from '@/components/auth/ParentGateModal';
import { navigationService } from '@/navigation/navigation.service';
import { ROUTES } from '@/navigation/routes';
import { useTheme } from '@/theme';
import { useProgression } from '@/context/ProgressionContext';
import { ProfileAura } from '@/components/progression/ProfileAura';
import { Ionicons } from '@expo/vector-icons';

export function GameSelectionScreen() {
  const { selectedChild } = useChildContext();
  const { data } = useProgression();
  const { theme, spacing, textStyles, radius } = useTheme();
  const avatar = AVATARS.find(a => a.id === selectedChild?.avatar) || AVATARS[0];

  const [parentGateVisible, setParentGateVisible] = useState(false);

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* ── Lobby Header ── */}
      <View style={[styles.lobbyHeader, { backgroundColor: theme.colors.surface + '20', borderColor: theme.colors.border }]}>
        <ProfileAura level={data?.level || 1}>
          <View style={[styles.avatarBox, { backgroundColor: avatar.color }]}>
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
          </View>
        </ProfileAura>
        <View style={styles.headerInfo}>
          <Text style={[textStyles.label, { color: theme.colors.textSecondary }]}>Harika Görünüyorsun,</Text>
          <View style={styles.nameRow}>
            <Text style={[textStyles.h2, { color: theme.colors.text }]}>{selectedChild?.firstName}!</Text>
            <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.levelText}>Lv. {data?.level || 1}</Text>
            </View>
          </View>
        </View>
        
        <Pressable 
          onPress={() => navigationService.goToProfilePicker('change_profile')}
          style={({ pressed }) => [
            styles.changeBtn, 
            { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary + '40' },
            pressed && styles.changeBtnPressed
          ]}
        >
          <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>

      <Pressable 
        onPress={() => navigationService.replace(ROUTES.WORLD_MAP as any)}
        style={({ pressed }) => [
          styles.mapBanner,
          { backgroundColor: theme.colors.secondary, borderRadius: radius.xl },
          pressed && styles.mapBannerPressed
        ]}
      >
        <View style={styles.mapBannerContent}>
          <Ionicons name="map" size={32} color="white" />
          <View>
            <Text style={styles.mapBannerTitle}>Macera Haritası</Text>
            <Text style={styles.mapBannerSubtitle}>Dünyaları keşfetmeye devam et!</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="white" />
      </Pressable>

      <View style={styles.content}>
        <Text style={[textStyles.h1, { color: theme.colors.text }]}>Neler Oynamak İstersin?</Text>
        
        <View style={styles.gameList}>
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onStart={() => navigationService.goToGamePlay(game.id)}
            />
          ))}
        </View>
      </View>

      {/* ── Parent Access (Discreet) ── */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.parentBtn, pressed && styles.parentBtnPressed]}
          onPress={() => setParentGateVisible(true)}
        >
          <Text style={[styles.parentBtnText, { color: theme.colors.textSecondary }]}>⚙️ Ayarlar</Text>
        </Pressable>
      </View>

      <ParentGateModal
        visible={parentGateVisible}
        onClose={() => setParentGateVisible(false)}
        onSuccess={() => {
          setParentGateVisible(false);
          navigationService.goToDashboard('lobby_parent_gate');
        }}
        actionLabel="Giriş Yap"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 32,
  },
  lobbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 34,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  changeBtnPressed: {
    opacity: 0.7,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
  mapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mapBannerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  mapBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mapBannerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  mapBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    gap: 24,
  },
  gameList: {
    gap: 16,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  parentBtn: {
    padding: 12,
  },
  parentBtnPressed: {
    opacity: 0.5,
  },
  parentBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
