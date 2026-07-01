import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { getApiBaseUrl } from '../../src/api/client';
import { colors } from '../../src/theme';

export default function SettingsScreen() {
  const { me, signOut } = useAuth();
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
