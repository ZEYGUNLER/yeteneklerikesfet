import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';

export const AVATARS = [
  { id: 'bear',      emoji: '🐻', color: '#FFE4E6' },
  { id: 'lion',      emoji: '🦁', color: '#FEF3C7' },
  { id: 'rabbit',    emoji: '🐰', color: '#F0FDF4' },
  { id: 'panda',     emoji: '🐼', color: '#ECFDF5' },
  { id: 'monkey',    emoji: '🐵', color: '#FFF7ED' },
  { id: 'cat',       emoji: '🐱', color: '#EEF2FF' },
  { id: 'fox',       emoji: '🦊', color: '#FFF1F2' },
  { id: 'koala',     emoji: '🐨', color: '#F1F5F9' },
  { id: 'penguin',   emoji: '🐧', color: '#EFF6FF' },
  { id: 'frog',      emoji: '🐸', color: '#F0FDF4' },
  { id: 'tiger',     emoji: '🐯', color: '#FFFBEB' },
  { id: 'elephant',  emoji: '🐘', color: '#F5F3FF' },
  { id: 'duck',      emoji: '🦆', color: '#ECFEFF' },
  { id: 'owl',       emoji: '🦉', color: '#FEF9C3' },
  { id: 'dolphin',   emoji: '🐬', color: '#E0F2FE' },
  { id: 'dragon',    emoji: '🐲', color: '#F0FDF4' },
];

interface AvatarPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  const { width } = useWindowDimensions();
  // Responsive: 4 columns on wide screens, 4 on normal, scale card
  const numCols = width > 500 ? 5 : 4;
  const cardSize = Math.floor((Math.min(width, 560) - 48 - (numCols - 1) * 10) / numCols);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Avatar Seçin</Text>
        <Text style={styles.labelSub}>
          {AVATARS.find(a => a.id === selectedId)?.emoji ?? '?'}
        </Text>
      </View>
      <View style={[styles.grid, { gap: 10 }]}>
        {AVATARS.map((avatar) => {
          const isSelected = selectedId === avatar.id;
          return (
            <Pressable
              key={avatar.id}
              onPress={() => onSelect(avatar.id)}
              style={({ pressed }) => [
                styles.avatarCard,
                {
                  backgroundColor: avatar.color,
                  width: cardSize,
                  height: cardSize,
                  borderRadius: cardSize * 0.25,
                },
                isSelected && styles.selectedCard,
                pressed && !isSelected && styles.pressedCard,
              ]}
            >
              <Text style={[styles.emoji, { fontSize: cardSize * 0.48 }]}>
                {avatar.emoji}
              </Text>
              {isSelected && (
                <View style={styles.checkDot}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSub: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  avatarCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  pressedCard: {
    opacity: 0.75,
    transform: [{ scale: 0.93 }],
  },
  emoji: {
    lineHeight: undefined,
  },
  checkDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
