import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../src/auth/AuthContext';
import { deleteAccount } from '../../src/api/client';
import { LEGAL_URLS, SUPPORT_EMAIL, SUPPORT_WEBSITE } from '../../src/constants/legal';
import { useRegisterPushNotifications } from '../../src/push/notifications';
import { colors } from '../../src/theme';

function LegalLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable onPress={() => void Linking.openURL(url)} style={styles.legalLink}>
      <Text style={styles.legalLinkText}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { token, me, signOut } = useAuth();
  const push = useRegisterPushNotifications(token);
  const [deleting, setDeleting] = useState(false);
  const session = (me?.session as Record<string, unknown> | undefined) ?? {};
  const client = (me?.client as Record<string, unknown> | undefined) ?? {};
  const notifications = (me?.notifications as { unreadCount?: number } | undefined) ?? {};

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your Simplifi Orb portal access, anonymizes your contact details on file, clears stored credentials, and removes push tokens for this account.\n\nLimited records may be retained for legal, security, or accounting requirements.\n\nThis cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => void runDeleteAccount(),
        },
      ],
    );
  };

  const runDeleteAccount = async () => {
    if (!token || deleting) return;
    setDeleting(true);
    try {
      const res = await deleteAccount(token);
      if (!res.ok) {
        Alert.alert('Could not delete account', res.error ?? 'Try again or email support.');
        return;
      }
      await signOut();
      Alert.alert(
        'Account deleted',
        res.message ?? 'Your account has been deleted.',
        [{ text: 'OK', onPress: () => router.replace('/login') }],
      );
    } finally {
      setDeleting(false);
    }
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
        <Text style={styles.label}>Legal & support</Text>
        <LegalLink label="Privacy Policy" url={LEGAL_URLS.privacy} />
        <LegalLink label="Terms of Service" url={LEGAL_URLS.terms} />
        <LegalLink label="EULA" url={LEGAL_URLS.eula} />
        <LegalLink label="AI Disclosure" url={LEGAL_URLS.aiDisclosure} />
        <LegalLink label="Support Policy" url={LEGAL_URLS.support} />
        <LegalLink label="Delete account (web)" url={LEGAL_URLS.accountDeletion} />
        <Text style={styles.meta}>Support: {SUPPORT_EMAIL}</Text>
        <Pressable onPress={() => void Linking.openURL(SUPPORT_WEBSITE)}>
          <Text style={styles.legalLinkText}>{SUPPORT_WEBSITE.replace(/^https?:\/\//, '')}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Notifications</Text>
        <Text style={styles.meta}>Unread: {notifications.unreadCount ?? 0}</Text>
      </View>

      <Pressable
        style={[styles.deleteBtn, deleting && styles.btnDisabled]}
        disabled={deleting || !token}
        onPress={confirmDeleteAccount}
      >
        <Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
      </Pressable>

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
  legalLink: { paddingVertical: 6 },
  legalLinkText: { color: colors.navy, fontWeight: '700', fontSize: 14, textDecorationLine: 'underline' },
  pushBtn: {
    marginTop: 12,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pushBtnText: { color: colors.navy, fontWeight: '800', fontSize: 14 },
  deleteBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { color: '#B91C1C', fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
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
