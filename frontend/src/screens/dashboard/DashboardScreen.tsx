import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { GozcuKarnesi } from '@/components/parent/GozcuKarnesi';
import { ProfileAggregationService, AggregateProfileReport } from '@/services/profileAggregationService';
import { useAuth } from '@/hooks/useAuth';
import { useChildContext } from '@/context/ChildContext';
import { useChildren } from '@/hooks/useChildren';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { navigationService } from '@/navigation/navigation.service';
import { useQueryClient } from '@tanstack/react-query';
import type { Child } from '@/services/child.service';

export const DashboardScreen = ({ childId: propChildId }: { childId: string }) => {
  const { width } = useWindowDimensions();
  const { logout } = useAuth();
  const { selectedChild, setSelectedChild } = useChildContext();
  const { children } = useChildren();
  const queryClient = useQueryClient();

  const effectiveChildId = selectedChild?.id || propChildId;

  // ── Gözcü Karnesi 2.0 State ──
  const [reportData, setReportData] = useState<AggregateProfileReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);

  const isWide = width >= 768;

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

  // Fetch and compile consolidated reports via ProfileAggregationService
  useEffect(() => {
    if (!effectiveChildId) return;

    let active = true;
    const fetchReport = async () => {
      try {
        setLoadingReport(true);
        setErrorReport(null);
        const report = await ProfileAggregationService.getAggregateReport(effectiveChildId, '90d'); // Fetch full 90d window to support client-side filtering
        if (active) {
          setReportData(report);
          setLoadingReport(false);
        }
      } catch (err) {
        if (active) {
          setErrorReport('Veriler yüklenirken veya analiz edilirken bir hata oluştu.');
          setLoadingReport(false);
        }
      }
    };

    void fetchReport();
    return () => {
      active = false;
    };
  }, [effectiveChildId]);

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.scroll}>
      <View style={[styles.root, isWide && styles.rootWide]}>
        
        {/* ── Top Portal Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.portalTitle}>Ebeveyn Portalı</Text>
            <Text style={styles.portalSub}>Çocuğunuzun bilişsel gelişimini izleyin ve yönetin.</Text>
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
              <Pressable
                onPress={() => navigationService.goToProfilePicker('dashboard_exit')}
                style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.backBtnText}>← Profil Sayfası</Text>
              </Pressable>
          </View>
        </View>

        {/* ── Analytics Content ── */}
        {!effectiveChildId ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={styles.emptyTitle}>Hoş Geldiniz</Text>
            <Text style={styles.emptyText}>
              Analizleri görüntülemek için lütfen bir çocuk profili seçin veya yeni bir profil oluşturun.
            </Text>
          </View>
        ) : (
          <GozcuKarnesi
            childId={effectiveChildId}
            realProfile={reportData?.profile || null}
            realReport={reportData?.report || null}
            realTrendData={reportData?.trendData || []}
            realLongitudinalReport={reportData?.longitudinalReport || null}
            realAdaptiveRecommendations={reportData?.adaptiveRecommendations || null}
            loading={loadingReport}
          />
        )}

        {(errorReport) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorReport}</Text>
            <Pressable
              onPress={() => {
                queryClient.invalidateQueries({ queryKey: ['dashboard', effectiveChildId] });
                // Re-trigger report aggregation
                setReportData(null);
              }}
              style={({ pressed }) => [styles.retryBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.retryBtnText}>Tekrar Dene</Text>
            </Pressable>
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
    zIndex: 1000,
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
    gap: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
