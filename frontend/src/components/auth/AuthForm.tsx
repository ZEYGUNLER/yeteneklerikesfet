import { StyleSheet, Text, View, Pressable } from 'react-native';
import { PasswordInput } from './PasswordInput';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useTheme } from '@/theme';

type AuthFormProps = {
  title: string;
  email: string;
  password: string;
  submitLabel: string;
  loading: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  footerText: string;
  footerActionLabel: string;
  onFooterActionPress: () => void;
};

export const AuthForm = ({
  title,
  email,
  password,
  submitLabel,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  footerText,
  footerActionLabel,
  onFooterActionPress,
}: AuthFormProps) => {
  const { theme, spacing, textStyles } = useTheme();

  return (
    <Card style={styles.card} padding="xl">
      <Text style={[textStyles.h2, { marginBottom: spacing.lg }]}>{title}</Text>

      <View style={styles.fields}>
        <Input
          label="E-posta"
          value={email}
          onChangeText={onEmailChange}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="ebeveyn@email.com"
          error={error ? ' ' : undefined} // Keep spacing for error but show at bottom
        />

        <View style={styles.field}>
          <Text style={[textStyles.label, { color: theme.colors.textSecondary, marginBottom: spacing.xs }]}>
            Şifre
          </Text>
          <PasswordInput value={password} onChangeText={onPasswordChange} />
        </View>
      </View>

      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

      <Button
        label={submitLabel}
        onPress={onSubmit}
        loading={loading}
        size="lg"
        style={{ marginTop: spacing.sm }}
      />

      <View style={styles.footerRow}>
        <Text style={[textStyles.body, { color: theme.colors.textSecondary, fontSize: 14 }]}>
          {footerText}
        </Text>
        <Pressable onPress={onFooterActionPress}>
          <Text style={[textStyles.bodyBold, { color: theme.colors.primary, fontSize: 14 }]}>
            {footerActionLabel}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  fields: {
    gap: 16,
  },
  field: {
    width: '100%',
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
});
