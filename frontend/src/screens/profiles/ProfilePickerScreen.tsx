import { useState, useRef, useEffect } from 'react';
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
  Alert,
  Platform,
} from 'react-native';
import Svg, { LinearGradient, RadialGradient, Rect, Defs, Stop, Circle as SvgCircle, Path, Polygon, G } from 'react-native-svg';
import { useChildContext } from '@/context/ChildContext';
import { useParentContext } from '@/context/ParentContext';
import { useAuth } from '@/hooks/useAuth';
import { AVATARS } from '@/components/profiles/AvatarPicker';
import { navigationService } from '@/navigation/navigation.service';
import { childService } from '@/services/child.service';
import { useQuery } from '@tanstack/react-query';
import { ParentGateModal } from '@/components/auth/ParentGateModal';
import { useTheme } from '@/theme';
import type { Child } from '@/services/child.service';

type ModalAction = 'dashboard' | 'addChild' | null;

const getArchetype = (childId: string) => {
  const archetypes = [
    { label: 'Meraklı Kaşif', color: '#FDE68A', gradient: ['#FEF3C7', '#FDE68A'] },
    { label: 'Akıl Mimarı', color: '#7DD3FC', gradient: ['#E0F2FE', '#7DD3FC'] },
    { label: 'Yol Bulucu', color: '#86EFAC', gradient: ['#DCFCE7', '#86EFAC'] },
    { label: 'Sessiz Gözlemci', color: '#A78BFA', gradient: ['#EDE9FE', '#A78BFA'] }
  ];
  let sum = 0;
  for (let i = 0; i < childId.length; i++) {
    sum += childId.charCodeAt(i);
  }
  return archetypes[sum % archetypes.length];
};

const getEmotionalCopy = (childId: string) => {
  const copies = [
    'Yeni keşifler seni bekliyor',
    'Macerana devam etmeye hazır',
    'Bugün yeni bir şey keşfedebilirsin',
    'Bahçende sürprizler var'
  ];
  let sum = 0;
  for (let i = 0; i < childId.length; i++) {
    sum += childId.charCodeAt(i);
  }
  return copies[sum % copies.length];
};

// SVG Ambient Halo Component
const HaloGlow = ({ color, scale, opacity }: { color: string, scale: Animated.AnimatedInterpolation<number> | Animated.Value, opacity: Animated.AnimatedInterpolation<number> | Animated.Value }) => (
  <Animated.View style={[styles.absoluteCenter, { transform: [{ scale }], opacity, zIndex: -1 }]}>
    <Svg width="200" height="200" viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <Stop offset="40%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <SvgCircle cx="100" cy="100" r="100" fill="url(#haloGrad)" />
    </Svg>
  </Animated.View>
);

export function ProfilePickerScreen() {
  const { setSelectedChild } = useChildContext();
  const { isParentVerified } = useParentContext();
  const { logout } = useAuth();
  
  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => childService.list(),
  });

  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Parallax background animations
  const cloudBgAnim = useRef(new Animated.Value(0)).current;
  const cloudMidAnim = useRef(new Animated.Value(0)).current;
  const islandAnim1 = useRef(new Animated.Value(0)).current;
  const islandAnim2 = useRef(new Animated.Value(0)).current;
  
  // Header cascade animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(20)).current;

  // Environment brightness and fade-out animations for selection transition
  const envBrighten = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  // Volumetric Sun rays breathing animation
  const sunRaysOpacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    const screenWidth = Dimensions.get('window').width;
    const startDrift = (anim: Animated.Value, duration: number, direction: 1 | -1) => {
      anim.setValue(direction === 1 ? -300 : screenWidth + 300);
      Animated.loop(
        Animated.timing(anim, {
          toValue: direction === 1 ? screenWidth + 300 : -300,
          duration: duration,
          useNativeDriver: true,
          isInteraction: false
        })
      ).start();
    };

    startDrift(cloudBgAnim, 160000, 1);
    startDrift(cloudMidAnim, 120000, 1);
    
    // Slow vertical breathing for islands
    const floatLoop = (anim: Animated.Value, distance: number, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: -distance, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true })
        ])
      ).start();
    };
    floatLoop(islandAnim1, 8, 8000);
    floatLoop(islandAnim2, 12, 11000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(sunRaysOpacity, { toValue: 0.3, duration: 8000, useNativeDriver: true }),
        Animated.timing(sunRaysOpacity, { toValue: 0.1, duration: 8000, useNativeDriver: true })
      ])
    ).start();
  }, [cloudBgAnim, cloudMidAnim, islandAnim1, islandAnim2, sunRaysOpacity, headerOpacity, headerTranslateY]);

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

  const handleProfileSelect = (child: Child) => {
    setSelectedChildId(child.id);

    Animated.sequence([
      Animated.delay(320),
      Animated.timing(envBrighten, {
        toValue: 0.6,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(async () => {
      await setSelectedChild(child);
      navigationService.goToGames();
    });
  };

  return (
    <View style={styles.root}>
      {/* ── Layer 1: Rich Sky Gradient ── */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#E0F2FE" />
              <Stop offset="40%" stopColor="#F0F9FF" />
              <Stop offset="100%" stopColor="#FFFAF0" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#skyGrad)" />
        </Svg>
      </View>

      {/* ── Layer 2: Distant Clouds ── */}
      <Animated.View style={[styles.absoluteLayer, { transform: [{ translateX: cloudBgAnim }], opacity: 0.15, top: '10%' }]}>
        <Svg width="400" height="150" viewBox="0 0 400 150" fill="#FFFFFF">
          <SvgCircle cx="80" cy="80" r="70" />
          <SvgCircle cx="180" cy="60" r="90" />
          <SvgCircle cx="300" cy="90" r="60" />
          <Rect x="80" y="50" width="220" height="100" />
        </Svg>
      </Animated.View>

      {/* ── Layer 3: Abstract Horizon Silhouettes (Monument Valley Style) ── */}
      {/* Abstract Stepped Mountain */}
      <Animated.View style={[styles.absoluteLayer, { transform: [{ translateY: islandAnim1 }], bottom: '15%', right: '-10%', opacity: 0.3 }]}>
        <Svg width="500" height="300" viewBox="0 0 500 300">
          <Defs>
            <LinearGradient id="mvGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#C084FC" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          <Path d="M100,300 L100,200 L200,200 L200,120 L300,120 L300,180 L400,180 L400,300 Z" fill="url(#mvGrad1)" />
        </Svg>
      </Animated.View>

      {/* Soft Curved Terrace */}
      <Animated.View style={[styles.absoluteLayer, { transform: [{ translateY: islandAnim2 }], bottom: '5%', left: '-5%', opacity: 0.35 }]}>
        <Svg width="450" height="250" viewBox="0 0 450 250">
          <Defs>
            <LinearGradient id="mvGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#99F6E4" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          <Path d="M0,250 Q100,120 250,150 T450,250 Z" fill="url(#mvGrad2)" />
          <Path d="M50,250 Q200,80 350,180 Z" fill="url(#mvGrad2)" opacity="0.6" />
        </Svg>
      </Animated.View>

      {/* ── Layer 4: Volumetric Light Rays ── */}
      <Animated.View style={[styles.absoluteLayer, { opacity: sunRaysOpacity, top: 0, right: 0, width: '60%', height: '60%' }]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="sunGlow" cx="100%" cy="0%" r="100%">
              <Stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
              <Stop offset="40%" stopColor="#FDE68A" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="500" height="500" fill="url(#sunGlow)" />
          <Polygon points="500,0 200,500 350,500" fill="#FFFFFF" opacity="0.4" />
          <Polygon points="500,0 0,500 150,500" fill="#FFFFFF" opacity="0.2" />
        </Svg>
      </Animated.View>

      {/* ── Layer 5: Main Content ── */}
      <Animated.View style={[styles.mainContainer, { opacity: screenFade }]}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            {/* Elegant Header */}
            <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
              <Text style={styles.title}>Tekrar Hoş Geldin</Text>
              <Text style={styles.subtitle}>Bugün hangi maceraya çıkıyoruz?</Text>
            </Animated.View>

            {isLoading && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.loadingText}>Dünya hazırlanıyor...</Text>
              </View>
            )}

            {!isLoading && children?.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyTitle}>Sihirli kapı seni bekliyor</Text>
                <Text style={styles.emptySubtitle}>
                  İlk kaşif profilini ekleyerek kendi serüvenine başla.
                </Text>
              </View>
            )}

            {!isLoading && (
              <View style={styles.grid}>
                {children?.map((child, index) => {
                  const avatar = AVATARS.find((a) => a.id === child.avatar) || AVATARS[0];
                  return (
                    <ProfileCard
                      key={child.id}
                      child={child}
                      avatar={avatar}
                      index={index}
                      selectedChildId={selectedChildId}
                      onPress={() => handleProfileSelect(child)}
                    />
                  );
                })}

                {(!children || children.length < 4) && (
                  <AddProfileCard
                    onPress={() => openParentGate('addChild')}
                    index={children?.length || 0}
                    selectedChildId={selectedChildId}
                  />
                )}
              </View>
            )}

            <View style={styles.footer}>
               <Pressable onPress={() => openParentGate('dashboard')} style={({ pressed }) => [styles.parentLink, pressed && styles.pressed]}>
                  <Text style={styles.parentLinkText}>EBEVEYN PORTALI</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      if (window.confirm('Hesabınızdan çıkmak ve giriş ekranına dönmek istiyor musunuz?')) {
                        logout().then(() => navigationService.goToLogin('account_switch'));
                      }
                    } else {
                      Alert.alert('Hesap Değiştir', 'Çıkış yapmak istiyor musunuz?', [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout().then(() => navigationService.goToLogin('account_switch')) }
                      ]);
                    }
                  }}
                  style={({ pressed }) => [styles.switchAccountBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.switchAccountText}>Farklı Bir Hesapla Giriş Yap</Text>
                </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: envBrighten }]} pointerEvents="none" />

      <ParentGateModal visible={modalAction !== null} onClose={() => setModalAction(null)} onSuccess={() => {
        const action = modalAction;
        setModalAction(null);
        executeAction(action);
      }} actionLabel="Doğrula" />
    </View>
  );
}

// ----------------------------------------------------------------------
// Profile Card
// ----------------------------------------------------------------------
interface ProfileCardProps {
  child: Child;
  avatar: any;
  index: number;
  selectedChildId: string | null;
  onPress: () => void;
}

function ProfileCard({ child, avatar, index, selectedChildId, onPress }: ProfileCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const avatarFloat = useRef(new Animated.Value(0)).current;

  // Selection animations
  const haloScale = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0.4)).current;
  const particlesAnim = useRef(new Animated.Value(0)).current;

  const archetype = getArchetype(child.id);
  const emotionalCopy = getEmotionalCopy(child.id);

  const isSelected = selectedChildId === child.id;
  const isAnySelected = selectedChildId !== null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay: 200 + index * 100, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay: 200 + index * 100, useNativeDriver: true }),
    ]).start();

    // Calm 9s breathing cycle for the avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarFloat, { toValue: -6, duration: 4500, useNativeDriver: true }),
        Animated.timing(avatarFloat, { toValue: 0, duration: 4500, useNativeDriver: true })
      ])
    ).start();
  }, [index, opacity, translateY, avatarFloat]);

  const handlePress = () => {
    if (isAnySelected) return;
    onPress();

    // 0-120ms: Scale bounce
    Animated.spring(scale, { toValue: 1.05, tension: 120, friction: 8, useNativeDriver: true }).start();

    // 120-220ms: Halo expansion
    Animated.parallel([
      Animated.timing(haloScale, { toValue: 1.6, duration: 150, delay: 120, useNativeDriver: true }),
      Animated.timing(haloOpacity, { toValue: 0.8, duration: 150, delay: 120, useNativeDriver: true })
    ]).start();

    // 220-320ms: Particles
    Animated.timing(particlesAnim, { toValue: 1, duration: 300, delay: 220, useNativeDriver: true }).start();
  };

  const particleDots = [
    { x: -50, y: -60, r: 4 }, { x: 50, y: -60, r: 3 },
    { x: -70, y: -10, r: 5 }, { x: 70, y: -10, r: 4 },
    { x: -40, y: 40, r: 3 },  { x: 40, y: 40, r: 5 },
  ];

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }, { translateY }], opacity: isAnySelected && !isSelected ? 0.4 : opacity }]}>
      
      {/* Particles Overlay */}
      {isSelected && particleDots.map((dot, i) => {
        const pX = particlesAnim.interpolate({ inputRange: [0, 1], outputRange: [0, dot.x] });
        const pY = particlesAnim.interpolate({ inputRange: [0, 1], outputRange: [0, dot.y] });
        const pScale = particlesAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={[styles.absoluteCenter, {
              width: dot.r * 2, height: dot.r * 2, borderRadius: dot.r,
              backgroundColor: archetype.color,
              transform: [{ translateX: pX }, { translateY: pY }, { scale: pScale }]
            }]}
          />
        );
      })}

      <Pressable onPress={handlePress} style={[styles.profileCard, isSelected && { borderColor: archetype.color }]}>
        {/* Avatar Section */}
        <Animated.View style={[styles.avatarContainer, { transform: [{ translateY: avatarFloat }] }]}>
          <HaloGlow color={archetype.color} scale={haloScale} opacity={haloOpacity} />
          
          <View style={[styles.avatarCircle, { backgroundColor: avatar.color }]}>
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
          </View>
        </Animated.View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.profileName} numberOfLines={1}>{child.firstName}</Text>
          <View style={[styles.archetypeBadge, { backgroundColor: `${archetype.color}1A` }]}>
            <Text style={[styles.archetypeText, { color: archetype.color === '#FDE68A' ? '#D97706' : archetype.color === '#86EFAC' ? '#059669' : archetype.color === '#7DD3FC' ? '#0284C7' : '#7C3AED' }]}>
              {archetype.label}
            </Text>
          </View>
          <Text style={styles.lastActiveText}>{emotionalCopy}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ----------------------------------------------------------------------
// Add Profile Card
// ----------------------------------------------------------------------
function AddProfileCard({ onPress, index, selectedChildId }: { onPress: () => void, index: number, selectedChildId: string | null }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  const isAnySelected = selectedChildId !== null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay: 200 + index * 100, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay: 200 + index * 100, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  const handlePressIn = () => { if (!isAnySelected) Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start(); };
  const handlePressOut = () => { if (!isAnySelected) Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start(); };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }, { translateY }], opacity: isAnySelected ? 0.4 : opacity }]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} disabled={isAnySelected} style={[styles.profileCard, styles.addCard]}>
        
        <View style={styles.addAvatarCircle}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="addGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#E0F2FE" />
                <Stop offset="100%" stopColor="#F3E8FF" />
              </LinearGradient>
            </Defs>
            <SvgCircle cx="50" cy="50" r="50" fill="url(#addGrad)" />
          </Svg>
          <Text style={styles.addPlusText}>+</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.profileName}>Yeni Kaşif Yarat</Text>
          <Text style={[styles.lastActiveText, { marginTop: 8 }]}>Kendi dünyanı inşa et</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FBFF' },
  safeArea: { flex: 1 },
  absoluteLayer: { position: 'absolute', zIndex: 0 },
  absoluteCenter: { position: 'absolute', top: '50%', left: '50%', marginTop: -100, marginLeft: -100, width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  mainContainer: { flex: 1, zIndex: 10 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: Dimensions.get('window').height * 0.12, paddingBottom: 60, alignItems: 'center' },
  
  header: { marginBottom: 60, alignItems: 'center', gap: 12 },
  title: { fontSize: 44, fontWeight: '800', color: '#0F172A', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 20, fontWeight: '500', color: '#475569', textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center', width: '100%', maxWidth: 1000 },
  
  cardWrapper: { width: 220, height: 280, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  
  profileCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  addCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderWidth: 2,
  },

  avatarContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
    position: 'relative'
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  avatarEmoji: { fontSize: 48 },

  addAvatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
    overflow: 'hidden'
  },
  addPlusText: { fontSize: 44, fontWeight: '300', color: '#818CF8' },

  infoContainer: { alignItems: 'center', width: '100%' },
  profileName: { fontSize: 22, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  archetypeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  archetypeText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  lastActiveText: { fontSize: 13, fontWeight: '500', color: '#94A3B8', textAlign: 'center', lineHeight: 18, paddingHorizontal: 4 },

  loadingWrapper: { paddingVertical: 100, alignItems: 'center', gap: 16 },
  loadingText: { color: '#64748B', fontSize: 18, fontWeight: '600' },
  
  emptyState: { paddingVertical: 60, alignItems: 'center', gap: 16, maxWidth: 320 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24 },

  footer: { marginTop: 80, alignItems: 'center', gap: 16 },
  parentLink: { paddingVertical: 12, paddingHorizontal: 24 },
  parentLinkText: { color: '#64748B', fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  switchAccountBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 99, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  switchAccountText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  pressed: { opacity: 0.6 }
});
