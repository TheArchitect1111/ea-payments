'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { writeOrbOsPreviewPreference } from '@/lib/orb-os';

export default function OrbOsPreviewToggle({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const toggle = async (next: boolean) => {
    setBusy(true);
    setNote('');
    try {
      writeOrbOsPreviewPreference(next);
      const res = await fetch('/api/simplifi/orb-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        setNote('Could not save preference.');
        return;
      }
      setEnabled(next);
      setNote(next ? 'Orb OS Preview on — opening Orb.' : 'Classic Simplifi restored.');
      router.push(next ? '/simplifi/orb' : '/simplifi/workspace?classic=1');
      router.refresh();
    } catch {
      setNote('Could not save preference.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="sw-muted" style={{ marginBottom: 12 }}>
        Conversation-first shell. Capture, Brief, Inbox, and search stay available — Orb reveals them when
        you ask. Classic UI remains with one click.
      </p>
      <div className="sw-card-actions">
        <button
          type="button"
          className="sw-btn sw-btn-small"
          disabled={busy || enabled}
          onClick={() => void toggle(true)}
        >
          Enable Orb OS Preview
        </button>
        <button
          type="button"
          className="sw-btn sw-btn-small sw-btn-ghost"
          disabled={busy || !enabled}
          onClick={() => void toggle(false)}
        >
          Use classic Simplifi
        </button>
      </div>
      {note ? <p className="sw-action-note">{note}</p> : null}
      <p className="sw-muted" style={{ marginTop: 10 }}>
        Direct link: <a href="/simplifi/orb?orb=1">/simplifi/orb?orb=1</a>
      </p>
    </div>
  );
}
