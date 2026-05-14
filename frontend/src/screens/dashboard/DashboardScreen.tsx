import { useState, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, ScrollView } from 'react-native';
import { InsightSection } from '@/components/parent/InsightSection';
import { ProgressChartSection } from '@/components/parent/ProgressChartSection';
import { SkillSummarySection } from '@/components/parent/SkillSummarySection';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useChildContext } from '@/context/ChildContext';
import { useChildren } from '@/hooks/useChildren';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { navigationService } from '@/navigation/navigation.service';
import type { Child } from '@/services/child.service';

type DashboardScreenProps = {
  childId: string;
};

export const DashboardScreen = ({ childId }: DashboardScreenProps) => {
  const { width } = useWindowDimensions();
  const { summary, progress, insight, loading, error } = useDashboard(childId);
  
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isWide = isDesktop || isTablet;

  const { logout } = useAuth();
  const { selectedChild, setSelectedChild } = useChildContext();
  const { children } = useChildren();

  // Handle child selection from switcher
  const handleSelectChild = async (child: Child) => {
    await setSelectedChild(child);
  };

  // Ensure a child is selected if possible
  useEffect(() => {
    if (!selectedChild && children.length > 0) {
      void setSelectedChild(children[0]);
    }
  }, [children, selectedChild, setSelectedChild]);

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.scroll}>
      <View style={[styles.root, isWide && styles.rootWide]}>
        
        {/* ── Top Portal Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.portalTitle}>Ebeveyn Portalı</Text>
            <Text style={styles.portalSub}>Çocuğunuzun gelişimini izleyin ve yönetin.</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Pressable
              onPress={async () => {
                await logout();
                navigationService.goToLogin('parent_logout');
              }}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.logoutText}>Güvenli Çıkış</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Sub Header: Child Switcher & Actions ── */}
        <View style={styles.actionBar}>
          <ChildSwitcher 
            children={children}
            selectedChild={selectedChild || null}
            onSelect={handleSelectChild}
            onAdd={() => navigationService.goToCreateChild()}
          />
          
          <View style={styles.actionGroup}>
             <Pressable
                onPress={() => navigationService.goToCreateChild()}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.primaryBtnText}>+ Çocuk Ekle</Text>
              </Pressable>
              {Platform.OS !== 'web' && (
                <Pressable
                  onPress={() => navigationService.goToProfilePicker('dashboard_exit')}
                  style={styles.backBtn}
                >
                  <Text style={styles.backBtnText}>Geri Dön</Text>
                </Pressable>
              )}
          </View>
        </View>

        {/* ── Analytics Content ── */}
        {!childId ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={styles.emptyTitle}>Hoş Geldiniz</Text>
            <Text style={styles.emptyText}>
              Analizleri görüntülemek için lütfen bir çocuk profili seçin veya yeni bir profil oluşturun.
            </Text>
          </View>
        ) : (
          <View style={[styles.grid, isWide && styles.gridWide]}>
            {/* Left Column: Skills & Insights */}
            <View style={styles.column}>
              <SkillSummarySection summary={summary} loading={loading} />
              <InsightSection insight={insight} />
            </View>

            {/* Right Column: Trends & Details */}
            <View style={[styles.column, isWide && styles.columnRight]}>
              <ProgressChartSection data={progress} loading={loading} />
              
              {/* Extra Stats Placeholder or Management Shortcuts */}
              <View style={styles.quickStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{progress.length}</Text>
                  <Text style={styles.statLab}>Toplam Oturum</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>
                    {summary?.lastUpdated ? 'Bugün' : '-'}
                  </Text>
                  <Text style={styles.statLab}>Son Aktivite</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Veriler güncellenirken bir sorun oluştu.</Text>
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
    padding: 20,
    gap: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  rootWide: {
    padding: 40,
  },
  
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  headerLeft: {
    gap: 4,
  },
  portalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  portalSub: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  logoutText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Action Bar ──
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000, // For switcher dropdown
    gap: 16,
    flexWrap: 'wrap',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtnText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // ── Grid ──
  grid: {
    gap: 24,
  },
  gridWide: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    gap: 24,
  },
  columnRight: {
    flex: 1.4, // Progress chart gets more space
  },

  // ── Stats ──
  quickStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  statLab: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },

  // ── States ──
  emptyState: {
    padding: 80,
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  errorBanner: {
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
});
