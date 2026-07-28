import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../src/auth/AuthContext';
import { LEGAL_ACCEPTANCE_KEY } from '../src/constants/legal';
import { colors } from '../src/theme';

export default function Index() {
  const { token, loading } = useAuth();
  const [legalReady, setLegalReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const accepted = await SecureStore.getItemAsync(LEGAL_ACCEPTANCE_KEY);
      if (!cancelled) setLegalReady(Boolean(accepted));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || legalReady === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!legalReady) {
    return <Redirect href="/legal-accept" />;
  }

  if (token) {
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/login" />;
}
