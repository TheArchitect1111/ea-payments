import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { colors } from '../../src/theme';

export default function AuthCallbackScreen() {
  const { token: magicToken } = useLocalSearchParams<{ token?: string }>();
  const { signInWithMagicToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!magicToken || typeof magicToken !== 'string') {
        setError('Missing login token.');
        return;
      }
      const res = await signInWithMagicToken(magicToken);
      if (res.ok) {
        router.replace('/(app)/home');
      } else {
        setError(res.error ?? 'Sign in failed.');
      }
    })();
  }, [magicToken, signInWithMagicToken]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.navy,
        padding: 24,
      }}
    >
      {!error ? (
        <>
          <ActivityIndicator color={colors.gold} />
          <Text style={{ color: colors.white, marginTop: 16 }}>Signing you in…</Text>
        </>
      ) : (
        <>
          <Text style={{ color: '#FCA5A5', textAlign: 'center', marginBottom: 20 }}>{error}</Text>
          <Pressable
            onPress={() => router.replace('/login')}
            style={{
              backgroundColor: colors.gold,
              borderRadius: 999,
              paddingVertical: 12,
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: colors.navy, fontWeight: '800' }}>Back to login</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
