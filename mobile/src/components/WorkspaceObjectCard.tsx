import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  activeSaveCapture,
  archiveCapture,
  recordCaptureOutcome,
  snoozeCapture,
} from '../api/client';
import { ACTIVE_SAVE_PURPOSES, OUTCOME_OPTIONS, type ActiveSavePurpose } from '../constants/workspace-actions';
import { colors } from '../theme';

export type WorkspaceObject = {
  id: string;
  title: string;
  status?: string;
  nextAction?: string;
  dueDate?: string;
  savePurpose?: string;
  outcomeStatus?: string;
};

type Props = {
  token: string;
  item: WorkspaceObject;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (message: string, remove?: boolean) => void;
};

export function WorkspaceObjectCard({ token, item, expanded, onToggle, onUpdated }: Props) {
  const [busy, setBusy] = useState(false);
  const [localNote, setLocalNote] = useState('');

  const run = async (action: () => Promise<{ ok?: boolean; error?: string }>, success: string, remove?: boolean) => {
    setBusy(true);
    setLocalNote('');
    const res = await action();
    setBusy(false);
    if (!res.ok) {
      setLocalNote(res.error ?? 'Action failed.');
      return;
    }
    onUpdated(success, remove);
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} disabled={busy}>
        <Text style={styles.title}>{item.title}</Text>
        {item.nextAction ? <Text style={styles.detail}>{item.nextAction}</Text> : null}
        {item.dueDate ? <Text style={styles.meta}>Due {item.dueDate}</Text> : null}
        {item.status ? <Text style={styles.meta}>{item.status}</Text> : null}
        <Text style={styles.expandHint}>{expanded ? 'Hide actions ▲' : 'Actions ▼'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.actions}>
          {busy ? <ActivityIndicator color={colors.gold} style={styles.spinner} /> : null}

          <Text style={styles.sectionLabel}>Outcome</Text>
          <View style={styles.chipRow}>
            {OUTCOME_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={styles.chip}
                disabled={busy}
                onPress={() =>
                  void run(
                    () => recordCaptureOutcome(token, item.id, option.id),
                    `Outcome: ${option.label}`,
                    option.id === 'won' || option.id === 'lost' || option.id === 'passed',
                  )
                }
              >
                <Text style={styles.chipText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.secondaryBtn}
            disabled={busy}
            onPress={() =>
              void run(
                () => snoozeCapture(token, item.id, 30),
                'Snoozed for 30 days.',
              )
            }
          >
            <Text style={styles.secondaryBtnText}>Snooze 30 days</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Active save</Text>
          <View style={styles.chipRow}>
            {ACTIVE_SAVE_PURPOSES.map((purpose) => (
              <Pressable
                key={purpose.id}
                style={styles.chipOutline}
                disabled={busy}
                onPress={() =>
                  void run(
                    () =>
                      activeSaveCapture(token, {
                        recordId: item.id,
                        purpose: purpose.id as ActiveSavePurpose,
                      }),
                    `Saved: ${purpose.label}`,
                  )
                }
              >
                <Text style={styles.chipOutlineText}>{purpose.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.dangerBtn}
            disabled={busy}
            onPress={() =>
              void run(() => archiveCapture(token, item.id), 'Archived.', true)
            }
          >
            <Text style={styles.dangerBtnText}>Archive</Text>
          </Pressable>

          {localNote ? <Text style={styles.note}>{localNote}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  expandHint: { color: colors.navy, marginTop: 10, fontWeight: '700', fontSize: 13 },
  actions: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  sectionLabel: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  chipOutline: {
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOutlineText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryBtnText: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  dangerBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  dangerBtnText: { color: colors.error, fontWeight: '800', fontSize: 13 },
  note: { color: colors.muted, marginTop: 10, fontSize: 13 },
  spinner: { marginBottom: 8 },
});
