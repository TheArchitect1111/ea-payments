import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { analyzeCaptureFile, analyzeUrl } from '../../src/api/client';
import { CaptureProcessingBanner } from '../../src/components/CaptureProcessingBanner';
import { colors } from '../../src/theme';

function fileNameFromUri(uri: string): string {
  const segment = uri.split('/').pop();
  return segment && segment.includes('.') ? segment : `capture-${Date.now()}.jpg`;
}

export default function CaptureScreen() {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [notes, setNotes] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ name: string; type: string } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAnalyzeResult = (res: { ok?: boolean; error?: string; processing?: boolean; captureId?: string }) => {
    if (!res.ok) {
      setError(res.error ?? 'Capture failed.');
      return;
    }
    if (res.processing && res.captureId) {
      setProcessingId(res.captureId);
      setMessage('');
    } else {
      setMessage('Capture saved. Open Workspace to review.');
    }
  };

  const submitUrl = async () => {
    if (!token || !url.trim()) return;
    setBusy(true);
    setError('');
    setMessage('');
    setProcessingId(null);
    const res = await analyzeUrl(token, {
      url: url.trim(),
      prospectName: prospectName.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    handleAnalyzeResult(res);
    if (res.ok) setUrl('');
  };

  const submitPhoto = async () => {
    if (!token || !previewUri || !previewMeta) return;
    setBusy(true);
    setError('');
    setMessage('');
    setProcessingId(null);
    const res = await analyzeCaptureFile(
      token,
      { uri: previewUri, name: previewMeta.name, type: previewMeta.type },
      { prospectName: prospectName.trim() || undefined, notes: notes.trim() || undefined },
    );
    setBusy(false);
    handleAnalyzeResult(res);
    if (res.ok) {
      setPreviewUri(null);
      setPreviewMeta(null);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Camera permission is required to capture photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    setPreviewMeta({
      name: asset.fileName ?? fileNameFromUri(asset.uri),
      type: asset.mimeType ?? 'image/jpeg',
    });
    setError('');
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    setPreviewMeta({
      name: asset.fileName ?? fileNameFromUri(asset.uri),
      type: asset.mimeType ?? 'image/jpeg',
    });
    setError('');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Text style={styles.lede}>
        Capture URLs or photos. Simplifi runs the same analysis pipeline as the web app — including vision on images.
      </Text>

      <Text style={styles.section}>URL capture</Text>
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

      <Text style={styles.section}>Photo capture</Text>
      <View style={styles.row}>
        <Pressable style={styles.btnSecondary} onPress={() => void pickFromCamera()} disabled={busy}>
          <Text style={styles.btnSecondaryText}>Camera</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary} onPress={() => void pickFromLibrary()} disabled={busy}>
          <Text style={styles.btnSecondaryText}>Gallery</Text>
        </Pressable>
      </View>
      {previewUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
          <Pressable style={styles.btn} onPress={() => void submitPhoto()} disabled={busy}>
            <Text style={styles.btnText}>{busy ? 'Uploading…' : 'Analyze photo'}</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.label}>Title (optional)</Text>
      <TextInput
        style={styles.input}
        value={prospectName}
        onChangeText={setProspectName}
        placeholder="Prospect or opportunity name"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Context, talking points, or voice transcript"
        placeholderTextColor={colors.muted}
      />

      <Pressable style={styles.btn} onPress={() => void submitUrl()} disabled={busy || !url.trim()}>
        <Text style={styles.btnText}>{busy ? 'Capturing…' : 'Capture URL'}</Text>
      </Pressable>

      {processingId && token ? (
        <CaptureProcessingBanner
          token={token}
          captureId={processingId}
          onComplete={() => setMessage('Capture ready. Open Workspace to review.')}
          onError={(msg) => setError(msg)}
        />
      ) : null}

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 20, paddingBottom: 40 },
  lede: { color: colors.muted, lineHeight: 21, marginBottom: 20 },
  section: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
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
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: { color: colors.navy, fontWeight: '800' },
  previewWrap: { marginBottom: 16 },
  preview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10 },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  success: { color: '#166534', marginTop: 16 },
  error: { color: colors.error, marginTop: 16 },
});
