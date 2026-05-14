import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenContainerProps = {
  children: ReactNode;
  /** Whether to wrap the content in a ScrollView */
  scrollable?: boolean;
  /** Whether to handle keyboard avoidance */
  withKeyboard?: boolean;
  /** Custom styles for the inner container */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Whether to add extra bottom padding for comfortable scrolling */
  paddedBottom?: boolean;
};

export const ScreenContainer = ({
  children,
  scrollable = false,
  withKeyboard = false,
  contentContainerStyle,
  paddedBottom = true,
}: ScreenContainerProps) => {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        paddedBottom && styles.paddedBottom,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.innerContent, contentContainerStyle]}>{children}</View>
  );

  const container = withKeyboard ? (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.container}>{content}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {container}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  innerContent: {
    flex: 1,
    padding: 16,
  },
  paddedBottom: {
    paddingBottom: 40,
  },
});
