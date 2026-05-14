import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useParentContext } from '@/context/ParentContext';
import { ParentGateModal } from '@/components/auth/ParentGateModal';
import { navigationService } from '@/navigation/navigation.service';
import { ThemeProvider, useTheme } from '@/theme';

interface ParentLayoutProps {
  children: React.ReactNode;
}

/**
 * World 3: PARENT WORLD (The Portal)
 * Atmosphere: Analytical, Clean, Structured, Professional.
 * SECURITY: Protected by ParentGateModal and session lifecycle.
 */
export const ParentLayout = ({ children }: ParentLayoutProps) => {
  const { isParentVerified } = useParentContext();
  const { theme } = useTheme();
  const [gateVisible, setGateVisible] = useState(false);

  // Check verification on mount and whenever isParentVerified changes
  useEffect(() => {
    if (!isParentVerified) {
      setGateVisible(true);
    }
  }, [isParentVerified]);

  const handleSuccess = () => {
    setGateVisible(false);
  };

  const handleClose = () => {
    // If parent cancels verification in the parent world, send them back to the child world
    setGateVisible(false);
    navigationService.goToProfilePicker('parent_gate_cancelled');
  };

  return (
    <ThemeProvider world="parent">
      <View style={styles.container}>
        <ParentGateModal 
          visible={gateVisible} 
          onClose={handleClose} 
          onSuccess={handleSuccess}
          actionLabel="Paneli Aç"
        />
        
        <View style={styles.sidebarPlaceholder} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Only render content if verified to avoid UI leakage during loading/transition */}
            {isParentVerified ? children : <View style={{ flex: 1, backgroundColor: theme.colors.background }} />}
          </View>
        </SafeAreaView>
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Professional light gray
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  sidebarPlaceholder: {
    // For future sidebar on Web
    width: Platform.OS === 'web' ? 0 : 0, 
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? 1200 : undefined,
    alignSelf: 'center',
    width: '100%',
  },
});
