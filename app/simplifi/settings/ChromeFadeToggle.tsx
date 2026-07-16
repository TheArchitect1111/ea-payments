'use client';

import { useEffect, useState } from 'react';
import {
  resolveChromeFadeClient,
  writeChromeFadePreference,
} from '@/lib/simplifi/chrome-fade';

export default function ChromeFadeToggle({ initialEnabled = false }: { initialEnabled?: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(resolveChromeFadeClient());
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    setEnabled(next);
    writeChromeFadePreference(next);
    try {
      await fetch('/api/simplifi/chrome-fade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
    } catch {
      // Cookie write already applied client-side.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sw-chrome-fade-toggle">
      <button
        type="button"
        className="sw-btn sw-btn-small"
        role="switch"
        aria-checked={enabled}
        disabled={saving}
        onClick={() => void toggle()}
      >
        {enabled ? 'Chrome Fade on' : 'Chrome Fade off'}
      </button>
      <p className="sw-muted" style={{ marginTop: 8 }}>
        When on, Brief / Capture / Inbox links hide from the header. Ask the Orb — or use Settings and
        the brand mark — to reach them. Brief stays your home.
      </p>
    </div>
  );
}
