import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { getApiBaseUrl } from '../../src/api/client';
import { useRegisterPushNotifications } from '../../src/push/notifications';
import { colors } from '../../src/theme';

export default function SettingsScreen() {
  const { token, me, signOut } = useAuth();
  const push = useRegisterPushNotifications(token);
  const session = (me?.session as Record<string, unknown> | undefined) ?? {};
  const client = (me?.client as Record<string, unknown> | undefined) ?? {};
  const notifications = (me?.notifications as { unreadCount?: number } | undefined) ?? {};

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{String(session.email ?? '—')}</Text>
        <Text style={styles.meta}>Portal: {String(session.slug ?? '—')}</Text>
        <Text style={styles.meta}>{String(client.organization ?? client.clientName ?? '')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Push alerts</Text>
        <Text style={styles.meta}>
          {push.state === 'registered'
            ? 'Enabled on this device'
            : push.state === 'unsupported'
              ? 'Use a physical device for push'
              : push.state === 'denied'
                ? 'Permission denied in system settings'
                : push.state === 'requesting'
                  ? 'Requesting permission…'
                  : 'Not registered'}
        </Text>
        {push.message ? <Text style={styles.meta}>{push.message}</Text> : null}
        <Pressable style={styles.pushBtn} onPress={() => void push.register()} disabled={push.state === 'requesting'}>
          <Text style={styles.pushBtnText}>Enable push notifications</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API</Text>
        <Text style={styles.meta}>{getApiBaseUrl()}</Text>
        <Text style={styles.meta}>Unread notifications: {notifications.unreadCount ?? 0}</Text>
      </View>

      <Pressable style={styles.signOut} onPress={() => void handleSignOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.gold, fontWeight: '800', fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  value: { color: colors.navy, fontWeight: '700', fontSize: 16 },
  meta: { color: colors.muted, marginTop: 6, fontSize: 14 },
  pushBtn: {
    marginTop: 12,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pushBtnText: { color: colors.navy, fontWeight: '800', fontSize: 14 },
  signOut: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: colors.navy, fontWeight: '800' },
});
