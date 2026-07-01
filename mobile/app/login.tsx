import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { requestMagicLink } from '../src/api/client';
import { colors } from '../src/theme';

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('token') ?? trimmed;
  } catch {
    const match = trimmed.match(/token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : trimmed;
  }
}

export default function LoginScreen() {
  const { signInWithMagicToken } = useAuth();
  const [email, setEmail] = useState('');
  const [linkPaste, setLinkPaste] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendLink = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const res = await requestMagicLink(email.trim().toLowerCase());
    setBusy(false);
    if (res.error) setError(res.error);
    else setMessage(res.message ?? 'Check your email for the login link.');
  };

  const completeSignIn = async () => {
    setBusy(true);
    setError('');
    const token = extractToken(linkPaste);
    const res = await signInWithMagicToken(token);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Sign in failed.');
      return;
    }
    router.replace('/(app)/home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>Never Lose An Opportunity Again™</Text>
        <Text style={styles.title}>Welcome to Simplifi™</Text>
        <Text style={styles.lede}>
          Enter your email on file. We will send a one-tap login link — no password needed.
        </Text>

        <Text style={styles.cardTitle}>Simplifi sign in</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          placeholderTextColor={colors.muted}
        />
        <Pressable style={styles.btnPrimary} onPress={() => void sendLink()} disabled={busy || !email.trim()}>
          <Text style={styles.btnPrimaryText}>{busy ? 'Sending…' : 'Email me a login link'}</Text>
        </Pressable>

        <Text style={[styles.label, { marginTop: 28 }]}>Paste login link or token</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          value={linkPaste}
          onChangeText={setLinkPaste}
          placeholder="Paste the link from your email"
          placeholderTextColor={colors.muted}
        />
        <Pressable style={styles.btnSecondary} onPress={() => void completeSignIn()} disabled={busy || !linkPaste.trim()}>
          <Text style={styles.btnSecondaryText}>{busy ? 'Signing in…' : 'Complete sign in'}</Text>
        </Pressable>

        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  scroll: { padding: 24, paddingTop: 72 },
  kicker: { color: colors.gold, fontWeight: '800', letterSpacing: 2, fontSize: 12 },
  title: { color: colors.white, fontSize: 28, fontWeight: '900', marginTop: 12 },
  lede: { color: '#CBD5E1', fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 20 },
  cardTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  textarea: { minHeight: 88, textAlignVertical: 'top' },
  btnPrimary: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: { color: colors.gold, fontWeight: '800', fontSize: 15 },
  success: { color: '#86EFAC', marginTop: 16, fontSize: 14 },
  error: { color: '#FCA5A5', marginTop: 16, fontSize: 14 },
});
