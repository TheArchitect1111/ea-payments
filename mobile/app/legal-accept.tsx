import { useCallback, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  LEGAL_ACCEPTANCE_COPY,
  LEGAL_ACCEPTANCE_KEY,
  LEGAL_URLS,
  SUPPORT_EMAIL,
} from '../src/constants/legal';
import { colors } from '../src/theme';

async function openUrl(url: string) {
  await Linking.openURL(url);
}

export default function LegalAcceptScreen() {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const accept = useCallback(async () => {
    if (!agreed) return;
    setBusy(true);
    await SecureStore.setItemAsync(LEGAL_ACCEPTANCE_KEY, new Date().toISOString());
    setBusy(false);
    router.replace('/');
  }, [agreed]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>SIMPLIFI ORB</Text>
      <Text style={styles.title}>{LEGAL_ACCEPTANCE_COPY.title}</Text>
      <Text style={styles.body}>{LEGAL_ACCEPTANCE_COPY.body}</Text>

      <View style={styles.links}>
        <Pressable onPress={() => void openUrl(LEGAL_URLS.eula)}>
          <Text style={styles.link}>EULA</Text>
        </Pressable>
        <Pressable onPress={() => void openUrl(LEGAL_URLS.terms)}>
          <Text style={styles.link}>Terms of Service</Text>
        </Pressable>
        <Pressable onPress={() => void openUrl(LEGAL_URLS.privacy)}>
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>
        <Pressable onPress={() => void openUrl(LEGAL_URLS.aiDisclosure)}>
          <Text style={styles.link}>AI Disclosure</Text>
        </Pressable>
        <Pressable onPress={() => void openUrl(LEGAL_URLS.support)}>
          <Text style={styles.link}>Support Policy</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.checkRow}
        onPress={() => setAgreed((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
      >
        <View style={[styles.box, agreed && styles.boxOn]} />
        <Text style={styles.checkLabel}>{LEGAL_ACCEPTANCE_COPY.checkbox}</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, (!agreed || busy) && styles.btnDisabled]}
        disabled={!agreed || busy}
        onPress={() => void accept()}
      >
        <Text style={styles.btnText}>{busy ? 'Saving…' : LEGAL_ACCEPTANCE_COPY.continue}</Text>
      </Pressable>

      <Text style={styles.support}>Support: {SUPPORT_EMAIL}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  content: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  kicker: { color: colors.gold, fontWeight: '800', letterSpacing: 1.2, fontSize: 11, marginBottom: 12 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800', marginBottom: 12 },
  body: { color: '#D0D7E4', fontSize: 15, lineHeight: 22, marginBottom: 20 },
  links: { gap: 10, marginBottom: 24 },
  link: { color: colors.gold, fontWeight: '700', fontSize: 15, textDecorationLine: 'underline' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gold,
    marginTop: 2,
  },
  boxOn: { backgroundColor: colors.gold },
  checkLabel: { flex: 1, color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  support: { marginTop: 24, color: '#8A93A3', fontSize: 13, textAlign: 'center' },
});
