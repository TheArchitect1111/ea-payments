import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { analyzeCaptureFile, analyzeUrl } from '../api/client';
import { flushCaptureQueue, listQueuedCaptures, type QueuedCapture } from './capture-queue';

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

type OfflineCaptureContextValue = {
  queueCount: number;
  syncing: boolean;
  lastMessage: string;
  refreshQueue: () => Promise<void>;
  syncNow: () => Promise<{ flushed: number; failed: number } | null>;
};

const OfflineCaptureContext = createContext<OfflineCaptureContextValue | null>(null);

export function OfflineCaptureProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  const refreshQueue = useCallback(async () => {
    const items = await listQueuedCaptures();
    setQueueCount(items.length);
  }, []);

  const submitQueuedItem = useCallback(
    async (item: QueuedCapture) => {
      if (!token) return { ok: false };
      if (item.kind === 'url') {
        return analyzeUrl(token, {
          url: item.url,
          prospectName: item.prospectName,
          notes: item.notes,
        });
      }
      return analyzeCaptureFile(
        token,
        { uri: item.uri, name: item.name, type: item.type },
        { prospectName: item.prospectName, notes: item.notes },
      );
    },
    [token],
  );

  const syncNow = useCallback(async () => {
    if (!token) return null;
    const online = await isOnline();
    if (!online) return null;

    setSyncing(true);
    try {
      const result = await flushCaptureQueue(submitQueuedItem);
      await refreshQueue();
      if (result.flushed > 0) {
        setLastMessage(
          `Sent ${result.flushed} queued capture${result.flushed === 1 ? '' : 's'}.`,
        );
      } else if (result.failed > 0) {
        setLastMessage('Some queued captures could not be sent yet.');
      }
      return result;
    } finally {
      setSyncing(false);
    }
  }, [token, submitQueuedItem, refreshQueue]);

  useEffect(() => {
    void refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    if (!token) return;

    void syncNow();
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void syncNow();
      }
    });
    return () => unsub();
  }, [token, syncNow]);

  const value = useMemo(
    () => ({ queueCount, syncing, lastMessage, refreshQueue, syncNow }),
    [queueCount, syncing, lastMessage, refreshQueue, syncNow],
  );

  return <OfflineCaptureContext.Provider value={value}>{children}</OfflineCaptureContext.Provider>;
}

export function useOfflineCapture() {
  const ctx = useContext(OfflineCaptureContext);
  if (!ctx) throw new Error('useOfflineCapture must be used within OfflineCaptureProvider');
  return ctx;
}
