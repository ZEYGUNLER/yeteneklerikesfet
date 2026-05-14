import { useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { navigationService } from '@/navigation/navigation.service';
import { ROUTES } from '@/navigation/routes';
import { getApiErrorMessage } from '@/utils/apiError';
import { ScreenContainer } from '@/components/common/ScreenContainer';

export const RegisterScreen = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);
      await register({ email, password });
      if (Platform.OS === 'web') {
        navigationService.goToDashboard('register_success_web');
      } else {
        navigationService.goToCreateChild();
      }
    } catch (e) {
      setError(getApiErrorMessage(e, 'Kayıt başarısız. Lütfen tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable withKeyboard contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Hesap Oluşturun</Text>
      <Text style={styles.subheading}>
        Çocuğunuzun yeteneğini keşfetmeye bugün başlayın.
      </Text>
      <AuthForm
        title="Ebeveyn Kaydı"
        email={email}
        password={password}
        submitLabel="Kayıt Ol"
        loading={loading}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        footerText="Zaten hesabınız var mı?"
        footerActionLabel="Giriş Yap"
        onFooterActionPress={() => navigationService.goToLogin()}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 28,
    gap: 16,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },
  subheading: {
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});
