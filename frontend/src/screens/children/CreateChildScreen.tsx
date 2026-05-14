import { Platform, StyleSheet, Text } from 'react-native';
import { CreateChildForm } from '@/components/children/CreateChildForm';
import { useChildren } from '@/hooks/useChildren';
import { useChildContext } from '@/context/ChildContext';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { navigationService } from '@/navigation/navigation.service';

export const CreateChildScreen = () => {
  const { createChild, isCreating, createError } = useChildren();
  const { setSelectedChild } = useChildContext();

  return (
    <ScreenContainer scrollable withKeyboard contentContainerStyle={styles.container}>
      <Text style={styles.title}>Yeni Çocuk Profili</Text>
      <Text style={styles.subtitle}>Aşağıdaki bilgileri doldurarak çocuk profili oluşturun.</Text>
      <CreateChildForm
        loading={isCreating}
        error={createError}
        onSubmit={async (payload) => {
          const child = await createChild(payload);
          await setSelectedChild(child);
          if (Platform.OS === 'web') {
            navigationService.goToDashboard('child_created_web');
          } else {
            navigationService.goToProfilePicker('child_created_mobile');
          }
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
});
