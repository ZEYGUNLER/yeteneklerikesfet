import { useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Input } from '../ui/Input';
import { useTheme } from '@/theme';

type PasswordInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
};

export const PasswordInput = ({
  value,
  onChangeText,
  placeholder = '••••••••',
  label,
  error,
}: PasswordInputProps) => {
  const [hidden, setHidden] = useState(true);
  const { theme } = useTheme();

  return (
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCapitalize="none"
      secureTextEntry={hidden}
      error={error}
      rightIcon={
        <Pressable onPress={() => setHidden((prev) => !prev)} style={styles.toggle}>
          <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
            {hidden ? 'Göster' : 'Gizle'}
          </Text>
        </Pressable>
      }
    />
  );
};

const styles = StyleSheet.create({
  toggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
