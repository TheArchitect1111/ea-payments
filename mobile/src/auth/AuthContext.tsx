import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { exchangeSessionToken, fetchMe, logout as apiLogout } from '../api/client';

const TOKEN_KEY = 'ea_simplifi_session_token';

type AuthContextValue = {
  token: string | null;
  loading: boolean;
  me: Record<string, unknown> | null;
  signInWithMagicToken: (magicToken: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setMe(null);
      return;
    }
    const data = await fetchMe(token);
    if (data.ok) {
      setMe(data as Record<string, unknown>);
    } else {
      setMe(null);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) setToken(stored);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      void refreshMe();
    }
  }, [loading, token, refreshMe]);

  const signInWithMagicToken = useCallback(async (magicToken: string) => {
    const result = await exchangeSessionToken(magicToken.trim());
    if (!result.ok || !result.token) {
      return { ok: false, error: result.error ?? 'Invalid or expired link.' };
    }
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setToken(result.token);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout(token);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setMe(null);
  }, [token]);

  const value = useMemo(
    () => ({ token, loading, me, signInWithMagicToken, signOut, refreshMe }),
    [token, loading, me, signInWithMagicToken, signOut, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
