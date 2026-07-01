import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { pollCaptureUntilReady } from '../api/capture-polling';
import type { CaptureStatusResponse } from '../api/client';
import { colors } from '../theme';

type Props = {
  token: string;
  captureId: string;
  onComplete?: (response: CaptureStatusResponse) => void;
  onError?: (message: string) => void;
};

export function CaptureProcessingBanner({ token, captureId, onComplete, onError }: Props) {
  const [status, setStatus] = useState('Analyzing your capture…');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await pollCaptureUntilReady(token, captureId, (tick) => {
          if (cancelled) return;
          if (tick.status) setStatus(`Status: ${tick.status}`);
          if (tick.record?.title) setDetail(String(tick.record.title));
        });
        if (cancelled) return;
        setStatus('Capture ready');
        setDetail(result.record?.title ? String(result.record.title) : 'Open Workspace to review.');
        onComplete?.(result);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Capture processing failed.';
        setStatus('Still processing');
        setDetail(message);
        onError?.(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, captureId, onComplete, onError]);

  return (
    <View style={styles.banner}>
      <ActivityIndicator color={colors.gold} />
      <View style={styles.copy}>
        <Text style={styles.title}>{status}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  copy: { flex: 1 },
  title: { color: colors.white, fontWeight: '700' },
  detail: { color: '#CBD5E1', marginTop: 4, fontSize: 13, lineHeight: 18 },
});
