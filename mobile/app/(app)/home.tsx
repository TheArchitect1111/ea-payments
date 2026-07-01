import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { fetchBrief } from '../../src/api/client';
import { colors } from '../../src/theme';

export default function HomeScreen() {
  const { token, me, refreshMe } = useAuth();
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await fetchBrief(token);
    if (data.ok) setBrief(data as Record<string, unknown>);
    await refreshMe();
  }, [token, refreshMe]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, [load]);

  const client = (me?.client as Record<string, unknown> | undefined) ?? {};
  const briefData = (brief?.brief as Record<string, unknown> | undefined) ?? {};
  const items = (briefData.items as Array<{ title: string; detail: string }> | undefined) ?? [];
  const greeting = String(briefData.greeting ?? 'Good morning.');

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.gold} />}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>TODAY</Text>
        <Text style={styles.title}>{greeting}</Text>
        <Text style={styles.sub}>
          {String(client.clientName ?? 'Signed in')} · {String(client.organization ?? '')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Focus items</Text>
        {items.length === 0 ? (
          <Text style={styles.muted}>No focus items yet. Capture something worth exploring.</Text>
        ) : (
          items.slice(0, 5).map((item, index) => (
            <View key={`${item.title}-${index}`} style={styles.row}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDetail}>{item.detail}</Text>
            </View>
          ))
        )}
      </View>

      <Pressable style={styles.refreshBtn} onPress={() => void onRefresh()}>
        <Text style={styles.refreshText}>Refresh brief</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  hero: { backgroundColor: colors.navy, padding: 24, paddingBottom: 28 },
  kicker: { color: colors.gold, fontWeight: '800', letterSpacing: 2, fontSize: 11 },
  title: { color: colors.white, fontSize: 26, fontWeight: '900', marginTop: 8 },
  sub: { color: '#CBD5E1', marginTop: 8, fontSize: 14 },
  card: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { color: colors.navy, fontWeight: '800', fontSize: 13, letterSpacing: 1, marginBottom: 12 },
  muted: { color: colors.muted, lineHeight: 20 },
  row: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { color: colors.navy, fontWeight: '700', fontSize: 15 },
  rowDetail: { color: colors.muted, marginTop: 4, fontSize: 13, lineHeight: 18 },
  refreshBtn: { alignSelf: 'center', marginBottom: 32 },
  refreshText: { color: colors.navy, fontWeight: '700' },
});
