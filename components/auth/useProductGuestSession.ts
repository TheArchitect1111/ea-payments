'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useProductGuestSession({
  loggedIn,
  autoStart = false,
  initialUrl,
}: {
  loggedIn: boolean;
  autoStart?: boolean;
  initialUrl?: string;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const startGuest = useCallback(async () => {
    setStarting(true);
    setError('');
    try {
      const res = await fetch('/api/demo/session', { method: 'POST' });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not start session.');
        setStarting(false);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError('Network error. Please try again.');
      setStarting(false);
      return false;
    }
  }, [router]);

  useEffect(() => {
    if (loggedIn || starting) return;
    if (!autoStart && !initialUrl?.trim()) return;

    const timer = window.setTimeout(() => {
      void startGuest();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loggedIn, autoStart, initialUrl, starting, startGuest]);

  return { starting: starting && !loggedIn, error, startGuest };
}
