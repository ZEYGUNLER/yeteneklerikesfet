import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import type { GameDefinition } from '@/services/game.service';

type GameCardProps = {
  game: GameDefinition;
  onStart: () => void;
};

export function GameCard({ game, onStart }: GameCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
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
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onStart} 
        style={styles.pressable}
      >
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{game.icon}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{game.description}</Text>
        </View>
        <View style={styles.playBtn}>
          <Text style={styles.playBtnText}>▶</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  icon: {
    fontSize: 32,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 2, // optical alignment
  },
});

