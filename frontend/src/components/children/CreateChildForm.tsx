import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { AvatarPicker } from '../profiles/AvatarPicker';
import { DashboardCard } from '../parent/DashboardCard';
import { CreateChildPayload } from '@/services/child.service';

type FieldError = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
};

type CreateChildFormProps = {
  loading: boolean;
  error: string | null;
  onSubmit: (payload: CreateChildPayload) => Promise<void>;
};

const GENDERS = [
  { key: 'boy',  label: 'Erkek', icon: '👦' },
  { key: 'girl', label: 'Kız', icon: '👧' },
];

export const CreateChildForm = ({ loading, error, onSubmit }: CreateChildFormProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('boy');
  const [avatar, setAvatar] = useState('bear');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [submitted, setSubmitted] = useState(false);

  const buttonDisabled = useMemo(
    () => loading || !firstName.trim() || !lastName.trim() || !birthDate.trim(),
    [loading, firstName, lastName, birthDate],
  );

  const validate = (): boolean => {
    const errors: FieldError = {};
    if (!firstName.trim()) errors.firstName = 'Ad zorunludur.';
    if (!lastName.trim()) errors.lastName = 'Soyad zorunludur.';
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthDate.trim()) {
      errors.birthDate = 'Doğum tarihi zorunludur.';
    } else if (!dateRegex.test(birthDate)) {
      errors.birthDate = 'YYYY-AA-GG formatını kullanın.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!validate()) return;
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      gender,
      avatar,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <DashboardCard title="Profil Detayları" subtitle="Çocuğunuzun temel bilgilerini girin.">
      <View style={styles.form}>
        {/* Name Grid */}
        <View style={styles.grid}>
          <View style={styles.field}>
            <Text style={styles.label}>AD</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Örn: Ali"
              style={[styles.input, fieldErrors.firstName && styles.inputError]}
            />
            {fieldErrors.firstName && <Text style={styles.errorText}>{fieldErrors.firstName}</Text>}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>SOYAD</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Örn: Yılmaz"
              style={[styles.input, fieldErrors.lastName && styles.inputError]}
            />
            {fieldErrors.lastName && <Text style={styles.errorText}>{fieldErrors.lastName}</Text>}
          </View>
        </View>

        {/* Date & Gender */}
        <View style={styles.grid}>
          <View style={styles.field}>
            <Text style={styles.label}>DOĞUM TARİHİ</Text>
            <TextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-AA-GG"
              style={[styles.input, fieldErrors.birthDate && styles.inputError]}
            />
            <Text style={styles.hint}>Örn: 2018-05-20</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>CİNSİYET</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <Pressable
                  key={g.key}
                  onPress={() => setGender(g.key)}
                  style={[styles.genderBtn, gender === g.key && styles.genderBtnActive]}
                >
                  <Text style={[styles.genderLabel, gender === g.key && styles.genderLabelActive]}>
                    {g.icon} {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Text style={styles.label}>AVATAR SEÇİN</Text>
          <AvatarPicker selectedId={avatar} onSelect={setAvatar} />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>EBEVEYN NOTLARI (OPSİYONEL)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="İlgi alanları, özel notlar..."
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {error && <Text style={styles.serverError}>{error}</Text>}

        <Pressable
          disabled={buttonDisabled}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitBtn,
            buttonDisabled && styles.submitBtnDisabled,
            pressed && styles.btnPressed
          ]}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'İşleniyor...' : 'Profili Kaydet'}
          </Text>
        </Pressable>
      </View>
    </DashboardCard>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  genderLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  avatarSection: {
    gap: 12,
    paddingVertical: 12,
  },
  serverError: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
