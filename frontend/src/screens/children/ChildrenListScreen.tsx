import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChildList } from '@/components/children/ChildList';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { useChildContext } from '@/context/ChildContext';
import { navigationService } from '@/navigation/navigation.service';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { DashboardCard } from '@/components/parent/DashboardCard';
import type { Child } from '@/services/child.service';

export const ChildrenListScreen = () => {
  const { logout } = useAuth();
  const { children, isLoading, error } = useChildren();
  const { selectedChild, setSelectedChild } = useChildContext();

  const handleSelect = async (child: Child) => {
    await setSelectedChild(child);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.scroll}>
      <View style={styles.root}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Profil Yönetimi</Text>
            <Text style={styles.subtitle}>Çocuk profillerini buradan ekleyebilir veya düzenleyebilirsiniz.</Text>
          </View>
          
          <View style={styles.headerActions}>
            {selectedChild && (
              <Pressable 
                onPress={() => navigationService.goToDashboard()} 
                style={styles.panelBtn}
              >
                <Text style={styles.panelBtnText}>Panele Dön</Text>
              </Pressable>
            )}
            <Pressable 
              onPress={async () => {
                await logout();
                navigationService.goToLogin('parent_list_logout');
              }} 
              style={styles.logoutBtn}
            >
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </Pressable>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Profiller yüklenirken bir hata oluştu.</Text>
          </View>
        )}

        {/* Main Management Card */}
        <DashboardCard 
          title="Kayıtlı Çocuklar" 
          subtitle="Gelişimini izlemek istediğiniz profili seçin."
          headerRight={
            <Pressable 
              onPress={() => navigationService.goToCreateChild()} 
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ Yeni Profil</Text>
            </Pressable>
          }
        >
          <ChildList
            items={children}
            selectedChildId={selectedChild?.id ?? null}
            onSelect={handleSelect}
            loading={isLoading}
          />
        </DashboardCard>

        {children.length === 0 && !isLoading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Henüz bir çocuk profili oluşturulmamış.</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  root: {
    padding: 24,
    gap: 32,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  panelBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  panelBtnText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  logoutText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '500',
  },
});
