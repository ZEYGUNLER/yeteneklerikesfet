import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Pressable } from 'react-native';
import { mascotEngine, MascotState, MascotMessage } from '@/services/mascotEngine';
import { MASCOTS, MascotId } from '@/config/mascot.config';
import { immersionSafetyRules } from '@/services/immersionSafetyRules';

const { width } = Dimensions.get('window');

interface MascotPresenceProps {
  mascotId?: MascotId;
  onPress?: () => void;
}

export const MascotPresence: React.FC<MascotPresenceProps> = ({ mascotId, onPress }) => {
  const [state, setState] = useState<MascotState>('hidden');
  const [message, setMessage] = useState<MascotMessage | null>(null);
  
  const slideAnim = useRef(new Animated.Value(100)).current; // Start off-screen
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = mascotEngine.subscribe((newState, newMessage) => {
      setState(newState);
      setMessage(newMessage);
    });
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    const safety = immersionSafetyRules.getSafeConfig();
    const isMinimal = safety.immersionLevel === 'minimal';

    if (state === 'hidden' || !mascotId) {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Bring mascot into view
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Subtle animations based on state, if not minimal mode
    if (!isMinimal) {
      if (state === 'celebrate') {
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -15, duration: 150, useNativeDriver: true }),
          Animated.spring(bounceAnim, { toValue: 0, friction: 4, tension: 50, useNativeDriver: true })
        ]).start();
      } else if (state === 'curious') {
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -5, duration: 200, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 5, duration: 400, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 200, useNativeDriver: true })
        ]).start();
      }
    }
  }, [state, mascotId]);

  if (!mascotId) return null;

  const mascotData = MASCOTS[mascotId];

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
      pointerEvents="box-none" // Allow mascot to be tapped, but don't block background
    >
      <View style={styles.mascotWrapper} pointerEvents="box-none">
        {message && (
          <View style={[styles.messageBubble, { borderColor: mascotData.color }]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}
        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
          <Pressable 
            style={[styles.mascotCircle, { backgroundColor: mascotData.color }]}
            onPress={onPress}
            disabled={!onPress}
          >
            <Text style={styles.emoji}>{mascotData.emoji}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 50, // Above ambient, below modals
  },
  mascotWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  mascotCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emoji: {
    fontSize: 24,
  },
  messageBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: width * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  }
});
