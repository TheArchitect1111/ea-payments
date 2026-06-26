'use client';

import { MissionControlExperience } from '@ea/portal-chassis/mission-control-experience';
import type { MissionControlResponse } from '@ea/portal-chassis/mission-control';

export default function MissionControlPanel({ mission }: { mission: MissionControlResponse }) {
  const handleIntent = async (intent: string) => {
    const q = intent.trim();
    if (!q) return;

    try {
      const res = await fetch('/api/admin/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        intent?: { href?: string; action?: string; message?: string };
      };

      if (data.intent?.action === 'capture') {
        window.dispatchEvent(new CustomEvent('ea:open-capture'));
        return;
      }

      if (data.intent?.href) {
        window.location.href = data.intent.href;
        return;
      }
    } catch {
      // Fall through to voice modal
    }

    window.dispatchEvent(new CustomEvent('ea:open-voice'));
  };

  return (
    <MissionControlExperience
      mission={mission}
      mode="executive"
      onIntentSubmit={handleIntent}
    />
  );
}
