import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useParentContext } from '@/context/ParentContext';
import { getApiErrorMessage } from '@/utils/apiError';
import { useTheme } from '@/theme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface ParentGateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionLabel?: string;
}

export function ParentGateModal({
  visible,
  onClose,
  onSuccess,
  actionLabel = 'Devam Et',
}: ParentGateModalProps) {
  const { theme, spacing, textStyles } = useTheme();
  const { email: storedEmail } = useAuth();
  const { verifyParent } = useParentContext();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPassword('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleVerify = async () => {
    if (!password || loading) return;

    if (!storedEmail) {
      setError('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyParent(password);
      reset();
      onSuccess();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Hatalı şifre. Lütfen tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Card style={styles.sheet} padding="xl" radius="xl">
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
            <Text style={styles.icon}>🔐</Text>
          </View>

          <Text style={[textStyles.h2, { textAlign: 'center' }]}>Ebeveyn Doğrulaması</Text>
          <Text style={[textStyles.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
            Bu alana erişmek için şifrenizi girin.
          </Text>

          {storedEmail && (
            <View style={[styles.emailBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[textStyles.bodyBold, { fontSize: 13, color: theme.colors.textSecondary }]} numberOfLines={1}>
                👤 {storedEmail}
              </Text>
            </View>
          )}

          <Input
            placeholder="Şifreniz"
            secureTextEntry
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError(null);
            }}
            onSubmitEditing={handleVerify}
            returnKeyType="go"
            error={error || undefined}
            autoFocus
          />

          <View style={styles.actions}>
            <Button 
              label={actionLabel}
              onPress={handleVerify}
              loading={loading}
              disabled={!password}
              size="lg"
            />

            <Button 
              label="İptal"
              variant="ghost"
              onPress={handleClose}
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    width: '90%',
    maxWidth: 400,
    gap: 20,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  icon: {
    fontSize: 28,
  },
  emailBadge: {
    alignSelf: 'center',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    maxWidth: '100%',
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
});
