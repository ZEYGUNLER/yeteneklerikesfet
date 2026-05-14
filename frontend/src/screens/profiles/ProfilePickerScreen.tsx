import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useChildContext } from '@/context/ChildContext';
import { useParentContext } from '@/context/ParentContext';
import { AVATARS } from '@/components/profiles/AvatarPicker';
import { navigationService } from '@/navigation/navigation.service';
import { childService } from '@/services/child.service';
import { useQuery } from '@tanstack/react-query';
import { ParentGateModal } from '@/components/auth/ParentGateModal';
import type { Child } from '@/services/child.service';

type ModalAction = 'dashboard' | 'addChild' | null;

export function ProfilePickerScreen() {
  const { setSelectedChild } = useChildContext();
  const { isParentVerified } = useParentContext();
  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => childService.list(),
  });

  const [modalAction, setModalAction] = useState<ModalAction>(null);

  const handleSelect = async (child: Child) => {
    // Selection Animation logic could be added here
    await setSelectedChild(child);
    navigationService.goToGames('profile_selected');
  };

  const executeAction = (action: ModalAction) => {
    if (action === 'dashboard') {
      navigationService.goToDashboard('profile_picker_parent');
    } else if (action === 'addChild') {
      navigationService.goToCreateChild();
    }
  };

  const openParentGate = (action: ModalAction) => {
    if (isParentVerified) {
      executeAction(action);
    } else {
      setModalAction(action);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>Kim oynuyor?</Text>
            <Text style={styles.subtitle}>Bir profil seç ve eğlenceye başla!</Text>
          </View>

          {/* ── Loading ── */}
          {isLoading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#A78BFA" />
              <Text style={styles.loadingText}>Profiller hazırlanıyor...</Text>
            </View>
          )}

          {/* ── Grid ── */}
          {!isLoading && (
            <View style={styles.grid}>
              {children?.map((child) => {
                const avatar = AVATARS.find((a) => a.id === child.avatar) || AVATARS[0];
                return (
                  <ProfileCard
                    key={child.id}
                    child={child}
                    avatar={avatar}
                    onPress={() => handleSelect(child)}
                  />
                );
              })}

              {/* Add Child Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.addChildCard,
                  pressed && styles.addChildCardPressed,
                ]}
                onPress={() => openParentGate('addChild')}
              >
                <View style={styles.addChildIcon}>
                  <Text style={styles.addChildPlus}>+</Text>
                </View>
                <Text style={styles.addChildText}>Yeni Profil</Text>
              </Pressable>
            </View>
          )}

          {/* ── Bottom: Parent Access (Discreet) ── */}
          <View style={styles.footer}>
             <Pressable
                onPress={() => openParentGate('dashboard')}
                style={({ pressed }) => [
                  styles.parentLink,
                  pressed && styles.parentLinkPressed
                ]}
              >
                <Text style={styles.parentLinkText}>Ebeveyn Portalı</Text>
              </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <ParentGateModal
        visible={modalAction !== null}
        onClose={() => setModalAction(null)}
        onSuccess={() => {
          const action = modalAction;
          setModalAction(null);
          executeAction(action);
        }}
        actionLabel="Doğrula"
      />
    </View>
  );
}

// Sub-component for individual cards with animation
function ProfileCard({ child, avatar, onPress }: { child: Child, avatar: any, onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.profileCard, { transform: [{ scale }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.profilePressable}
      >
        <View style={[styles.avatarRing, { borderColor: avatar.color }]}>
          <View style={[styles.avatarBg, { backgroundColor: avatar.color }]}>
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
          </View>
        </View>
        <Text style={styles.profileName} numberOfLines={1}>
          {child.firstName}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const numColumns = isTablet ? 3 : 2;
const cardPadding = 40;
const gap = 24;
const cardSize = (Math.min(width, 800) - cardPadding * 2 - gap * (numColumns - 1)) / numColumns;
const avatarSize = cardSize * 0.85;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent', // Let layout handle background
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: cardPadding,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gap,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 800,
  },
  profileCard: {
    width: cardSize,
    alignItems: 'center',
  },
  profilePressable: {
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: cardSize,
    height: cardSize,
    borderRadius: cardSize * 0.28,
    borderWidth: 4,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatarBg: {
    flex: 1,
    width: '100%',
    borderRadius: cardSize * 0.22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarEmoji: {
    fontSize: cardSize * 0.45,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  addChildCard: {
    width: cardSize,
    alignItems: 'center',
    gap: 12,
  },
  addChildCardPressed: {
    opacity: 0.7,
  },
  addChildIcon: {
    width: cardSize,
    height: cardSize,
    borderRadius: cardSize * 0.28,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  addChildPlus: {
    fontSize: 40,
    color: '#64748B',
  },
  addChildText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  loadingWrapper: {
    paddingVertical: 100,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
  },
  parentLink: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  parentLinkPressed: {
    opacity: 0.6,
  },
  parentLinkText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
