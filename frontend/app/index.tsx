import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useInitialRoute } from '@/hooks/useInitialRoute';

export default function Home() {
  const { initialRoute, isInitializing } = useInitialRoute();

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '600' }}>
          Başlatılıyor...
        </Text>
      </View>
    );
  }

  if (!initialRoute) return null;

  return <Redirect href={initialRoute as any} />;
}

