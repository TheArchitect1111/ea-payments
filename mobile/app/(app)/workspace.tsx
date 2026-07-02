import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { fetchWorkspace } from '../../src/api/client';
import { WorkspaceObjectCard, type WorkspaceObject } from '../../src/components/WorkspaceObjectCard';
import { colors } from '../../src/theme';

export default function WorkspaceScreen() {
  const { token } = useAuth();
  const [rows, setRows] = useState<WorkspaceObject[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    const data = await fetchWorkspace(token);
    if (!data.ok) {
      setError(data.error ?? 'Could not load workspace.');
      return;
    }
    const workspace = (data.workspace as Record<string, unknown> | undefined) ?? {};
    const active = (workspace.activeObjects as WorkspaceObject[] | undefined) ?? [];
    setRows(active);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpdated = (recordId: string, message: string, remove?: boolean) => {
    setBanner(message);
    if (remove) {
      setRows((prev) => prev.filter((row) => row.id !== recordId));
      setExpandedId(null);
    } else {
      void load();
    }
  };

  return (
    <View style={styles.root}>
      {banner ? <Text style={styles.banner}>{banner}</Text> : null}
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
          <WorkspaceObjectCard
            token={token!}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
            onUpdated={(message, remove) => handleUpdated(item.id, message, remove)}
          />
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
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    color: '#166534',
    fontWeight: '600',
  },
  empty: { color: colors.muted, textAlign: 'center', padding: 32, lineHeight: 22 },
  refreshBtn: { alignItems: 'center', padding: 24 },
  refreshText: { color: colors.navy, fontWeight: '700' },
});
