'use client';

import { useRouter } from 'next/navigation';
import { MissionControlExperience } from '@ea/portal-chassis/mission-control-experience';
import type { MissionControlResponse } from '@ea/portal-chassis/mission-control';
import { startGuidedTour } from '@/app/admin/_components/GuidedTour';

type Props = {
  mission: MissionControlResponse;
  mode?: 'executive' | 'builder';
};

export function MissionControlPanel({ mission, mode = 'executive' }: Props) {
  const router = useRouter();

  async function handleIntentSubmit(intent: string) {
    const res = await fetch('/api/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      route?: { type: string; href?: string };
      voice?: { action: string; href?: string; message?: string };
    };

    if (!res.ok || !data.voice) return;

    const voice = data.voice;
    if (voice.action === 'tour') {
      startGuidedTour();
      return;
    }
    if (voice.action === 'capture') {
      window.dispatchEvent(new CustomEvent('ea:open-capture'));
      return;
    }
    if (voice.href) {
      router.push(voice.href);
      return;
    }

    window.dispatchEvent(
      new CustomEvent('ea:open-voice', { detail: { query: intent, message: voice.message } }),
    );
  }

  return (
    <MissionControlExperience
      mission={mission}
      mode={mode}
      onIntentSubmit={(intent) => void handleIntentSubmit(intent)}
    />
  );
}
