import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { analyzeUrl } from '../../src/api/client';
import { colors } from '../../src/theme';

export default function CaptureScreen() {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!token || !url.trim()) return;
    setBusy(true);
    setError('');
    setMessage('');
    const res = await analyzeUrl(token, { url: url.trim(), prospectName: prospectName.trim() || undefined });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Capture failed.');
      return;
    }
    if (res.processing) {
      setMessage(`Processing capture ${String(res.captureId ?? '')}. Check workspace soon.`);
    } else {
      setMessage('Capture saved. Open Workspace to review.');
    }
    setUrl('');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.lede}>Save a URL from anywhere. Simplifi analyzes it on the same brain as the web app.</Text>
      <Text style={styles.label}>URL</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
        placeholder="https://example.com/opportunity"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.label}>Title (optional)</Text>
      <TextInput
        style={styles.input}
        value={prospectName}
        onChangeText={setProspectName}
        placeholder="Prospect or opportunity name"
        placeholderTextColor={colors.muted}
      />
      <Pressable style={styles.btn} onPress={() => void submit()} disabled={busy || !url.trim()}>
        <Text style={styles.btnText}>{busy ? 'Capturing…' : 'Capture URL'}</Text>
      </Pressable>
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, padding: 20 },
  lede: { color: colors.muted, lineHeight: 21, marginBottom: 20 },
  label: { color: colors.navy, fontWeight: '800', fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  success: { color: '#166534', marginTop: 16 },
  error: { color: colors.error, marginTop: 16 },
});
