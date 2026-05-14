import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Child } from '@/services/child.service';
import { AVATARS } from '../profiles/AvatarPicker';

type ChildCardProps = {
  child: Child;
  selected: boolean;
  onPress: () => void;
};

export const ChildCard = ({ child, selected, onPress }: ChildCardProps) => {
  const avatar = AVATARS.find(a => a.id === child.avatar) || AVATARS[0];
  const birthDate = new Date(child.birthDate).toLocaleDateString('tr-TR');

  return (
    <View style={[styles.container, selected && styles.containerSelected]}>
      <Pressable 
        style={styles.mainArea} 
        onPress={onPress}
      >
        <View style={[styles.avatarBox, { backgroundColor: avatar.color }]}>
          <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{child.firstName} {child.lastName}</Text>
          <Text style={styles.meta}>Doğum: {birthDate}</Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <View style={[styles.statusBadge, selected && styles.statusBadgeActive]}>
          <Text style={[styles.statusText, selected && styles.statusTextActive]}>
            {selected ? 'Aktif' : 'Beklemede'}
          </Text>
        </View>
        
        <Pressable 
          style={styles.settingsBtn}
          onPress={() => {
            // Future: navigationService.goToEditChild(child.id)
            if (__DEV__) console.log('Edit child:', child.id);
          }}
        >
          <Text style={styles.settingsText}>Ayarlar</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  containerSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  info: {
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  meta: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  statusBadgeActive: {
    backgroundColor: '#2563EB',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  settingsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  settingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
});
