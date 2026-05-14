import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { AVATARS } from '@/components/profiles/AvatarPicker';
import type { Child } from '@/services/child.service';
import { useTheme } from '@/theme';

interface ChildSwitcherProps {
  children: Child[];
  selectedChild: Child | null;
  onSelect: (child: Child) => void;
  onAdd: () => void;
}

export const ChildSwitcher = ({ 
  children, 
  selectedChild, 
  onSelect, 
  onAdd 
}: ChildSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, spacing, textStyles, radius } = useTheme();
  
  const activeAvatar = AVATARS.find(a => a.id === selectedChild?.avatar) || AVATARS[0];

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={[
          styles.trigger, 
          { 
            backgroundColor: theme.colors.surface, 
            borderColor: isOpen ? theme.colors.primary : theme.colors.border,
            borderRadius: radius.lg,
          },
          isOpen && styles.triggerOpen
        ]}
      >
        <View style={[styles.avatarBg, { backgroundColor: activeAvatar.color }]}>
          <Text style={styles.avatarEmoji}>{activeAvatar.emoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[textStyles.label, { color: theme.colors.textSecondary, fontSize: 10 }]}>Aktif Profil</Text>
          <Text style={[textStyles.bodyBold, { color: theme.colors.text }]} numberOfLines={1}>
            {selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : 'Seçilmedi'}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
          {isOpen ? '▲' : '▼'}
        </Text>
      </Pressable>

      {isOpen && (
        <View style={[
          styles.dropdown, 
          { 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.primary,
            borderBottomLeftRadius: radius.lg,
            borderBottomRightRadius: radius.lg,
            ...theme.shadows.lg
          }
        ]}>
          <ScrollView style={styles.scroll} bounces={false}>
            {children.map((child) => {
              const avatar = AVATARS.find(a => a.id === child.avatar) || AVATARS[0];
              const isActive = child.id === selectedChild?.id;
              
              return (
                <Pressable
                  key={child.id}
                  onPress={() => {
                    onSelect(child);
                    setIsOpen(false);
                  }}
                  style={[
                    styles.item, 
                    { borderBottomColor: theme.colors.border },
                    isActive && { backgroundColor: theme.colors.primary + '08' }
                  ]}
                >
                  <View style={[styles.itemAvatar, { backgroundColor: avatar.color }]}>
                    <Text style={styles.itemEmoji}>{avatar.emoji}</Text>
                  </View>
                  <Text style={[
                    textStyles.body, 
                    { flex: 1, color: isActive ? theme.colors.primary : theme.colors.text },
                    isActive && { fontWeight: '800' }
                  ]}>
                    {child.firstName} {child.lastName}
                  </Text>
                  {isActive && <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />}
                </Pressable>
              );
            })}
          </ScrollView>
          
          <Pressable 
            onPress={() => {
              setIsOpen(false);
              onAdd();
            }} 
            style={[styles.addButton, { backgroundColor: theme.colors.background }]}
          >
            <Text style={[textStyles.bodyBold, { color: theme.colors.primary, fontSize: 13 }]}>
              + Yeni Profil Ekle
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1000,
    width: 240,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  avatarBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  chevron: {
    fontSize: 10,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderTopWidth: 0,
    overflow: 'hidden',
  },
  scroll: {
    maxHeight: 280,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 18,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  addButton: {
    padding: 14,
    alignItems: 'center',
  },
});
