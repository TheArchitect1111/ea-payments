import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { fetchWorkspace } from '../../src/api/client';
import { colors } from '../../src/theme';

type ObjectRow = { id: string; title: string; status?: string; nextAction?: string };

export default function WorkspaceScreen() {
  const { token } = useAuth();
  const [rows, setRows] = useState<ObjectRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    const data = await fetchWorkspace(token);
    if (!data.ok) {
      setError(data.error ?? 'Could not load workspace.');
      return;
    }
    const workspace = (data.workspace as Record<string, unknown> | undefined) ?? {};
    const active = (workspace.activeObjects as ObjectRow[] | undefined) ?? [];
    setRows(active);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
            tintColor={colors.gold}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{error || 'No active opportunities yet. Capture something first.'}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            {item.nextAction ? <Text style={styles.detail}>{item.nextAction}</Text> : null}
            {item.status ? <Text style={styles.meta}>{item.status}</Text> : null}
          </View>
        )}
        ListFooterComponent={
          <Pressable style={styles.refreshBtn} onPress={() => void load()}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  empty: { color: colors.muted, textAlign: 'center', padding: 32, lineHeight: 22 },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.navy, fontWeight: '800', fontSize: 16 },
  detail: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  meta: { color: colors.gold, marginTop: 8, fontSize: 12, fontWeight: '700' },
  refreshBtn: { alignItems: 'center', padding: 24 },
  refreshText: { color: colors.navy, fontWeight: '700' },
});
