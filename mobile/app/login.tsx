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
import { SIMPLIFI_LOGIN_COPY } from '../src/constants/realm-login-copy';
import { colors } from '../src/theme';

const copy = SIMPLIFI_LOGIN_COPY;

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
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendLink = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const res = await requestMagicLink(email.trim().toLowerCase());
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSent(true);
    setMessage(res.message ?? copy.sentMessage);
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
        <Text style={styles.kicker}>{copy.eyebrow}</Text>
        <Text style={styles.title}>{copy.pageTitle}</Text>
        <Text style={styles.lede}>{copy.pageSubtitle}</Text>

        {sent ? (
          <View style={styles.sentCard}>
            <Text style={styles.cardTitle}>{copy.sentTitle}</Text>
            <Text style={styles.success}>{message || copy.sentMessage}</Text>
            <Text style={styles.sentDetail}>{copy.sentDetail}</Text>
            <Pressable style={styles.btnSecondary} onPress={() => setSent(false)}>
              <Text style={styles.btnSecondaryText}>{copy.sendAnotherLabel}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.cardTitle}>{copy.cardTitle}</Text>
            <Text style={styles.cardSubtitle}>{copy.cardSubtitle}</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder={copy.emailPlaceholder}
              placeholderTextColor={colors.muted}
            />
            <Pressable
              style={styles.btnPrimary}
              onPress={() => void sendLink()}
              disabled={busy || !email.trim()}
            >
              <Text style={styles.btnPrimaryText}>{busy ? 'Sending…' : copy.buttonLabel}</Text>
            </Pressable>
          </>
        )}

        <Text style={[styles.label, { marginTop: 28 }]}>Paste login link or token</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          value={linkPaste}
          onChangeText={setLinkPaste}
          placeholder="Paste the link from your email"
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={styles.btnSecondary}
          onPress={() => void completeSignIn()}
          disabled={busy || !linkPaste.trim()}
        >
          <Text style={styles.btnSecondaryText}>{busy ? 'Signing in…' : 'Complete sign in'}</Text>
        </Pressable>

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
  sentCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  cardTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  cardSubtitle: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  sentDetail: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 12 },
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
  success: { color: '#86EFAC', fontSize: 14, fontWeight: '600' },
  error: { color: '#FCA5A5', marginTop: 16, fontSize: 14 },
});
