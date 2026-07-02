import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useOfflineCapture } from '../offline/OfflineCaptureContext';
import { colors } from '../theme';

export function OfflineQueueBanner() {
  const { queueCount, syncing, lastMessage, syncNow } = useOfflineCapture();

  if (queueCount === 0 && !lastMessage) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.copy}>
        <Text style={styles.title}>
          {queueCount > 0
            ? `${queueCount} capture${queueCount === 1 ? '' : 's'} queued offline`
            : 'Offline queue'}
        </Text>
        {lastMessage ? <Text style={styles.detail}>{lastMessage}</Text> : null}
        {queueCount > 0 ? (
          <Text style={styles.detail}>We sync automatically when you reconnect.</Text>
        ) : null}
      </View>
      {queueCount > 0 ? (
        <Pressable style={styles.btn} onPress={() => void syncNow()} disabled={syncing}>
          <Text style={styles.btnText}>{syncing ? 'Syncing…' : 'Sync now'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  copy: { gap: 4 },
  title: { color: colors.navy, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
