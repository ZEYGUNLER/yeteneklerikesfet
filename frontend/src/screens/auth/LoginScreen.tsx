import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { navigationService } from '@/navigation/navigation.service';
import { ROUTES } from '@/navigation/routes';
import { getApiErrorMessage } from '@/utils/apiError';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useTheme } from '@/theme';

export const LoginScreen = () => {
  const { login } = useAuth();
  const { theme, spacing, textStyles } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);
      await login({ email, password });
      if (Platform.OS === 'web') {
        navigationService.goToDashboard('login_success_web');
      } else {
        navigationService.replace(ROUTES.ROOT, 'login_success_mobile');
      }
    } catch (e) {
      setError(getApiErrorMessage(e, 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable withKeyboard contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[textStyles.h1, { textAlign: 'center' }]}>Hoş Geldiniz</Text>
        <Text style={[textStyles.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
          Çocuğunuzun gelişimini takip etmek için giriş yapın.
        </Text>
      </View>

      <AuthForm
        title="Ebeveyn Girişi"
        email={email}
        password={password}
        submitLabel="Giriş Yap"
        loading={loading}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        footerText="Hesabınız yok mu?"
        footerActionLabel="Kayıt Ol"
        onFooterActionPress={() => navigationService.goToRegister()}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    gap: 32,
    justifyContent: 'center',
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
});
