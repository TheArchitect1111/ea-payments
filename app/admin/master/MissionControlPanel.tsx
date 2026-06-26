'use client';

import { useEffect, useState } from 'react';
import { MissionControlExperience } from '@ea/portal-chassis/mission-control-experience';
import type { MissionControlResponse } from '@ea/portal-chassis/mission-control';
import { startGuidedTour } from '../_components/GuidedTour';
import {
  readOperatingMode,
  type OperatingMode,
} from '@/lib/admin-operating-mode';

type OrchestrationPayload = {
  response?: {
    summary?: string;
    recommendedNextSteps?: string[];
    confidence?: number;
  };
  agents?: Array<{ name: string; status: string }>;
};

export default function MissionControlPanel({ mission }: { mission: MissionControlResponse }) {
  const [mode, setMode] = useState<OperatingMode>('executive');
  const [status, setStatus] = useState<string | null>(null);
  const [orchestration, setOrchestration] = useState<OrchestrationPayload | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode(readOperatingMode());
    const onMode = (e: Event) => {
      const detail = (e as CustomEvent<OperatingMode>).detail;
      if (detail) setMode(detail);
    };
    window.addEventListener('ea:operating-mode-change', onMode);
    return () => window.removeEventListener('ea:operating-mode-change', onMode);
  }, []);

  const handleIntent = async (intent: string) => {
    const q = intent.trim();
    if (!q) return;

    setBusy(true);
    setStatus(null);
    setOrchestration(null);

    try {
      const res = await fetch('/api/admin/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        route?: {
          type: string;
          message?: string;
          whyRecommended?: string;
          href?: string;
          followUpHref?: string;
        };
        orchestration?: OrchestrationPayload;
        orchestrationError?: string;
      };

      if (!data.ok || !data.route) {
        setStatus('Could not route that intent. Try EA Voice (Ctrl+Shift+V).');
        return;
      }

      const route = data.route;
      const why = route.whyRecommended ? ` ${route.whyRecommended}` : '';
      setStatus(`${route.message ?? 'Done.'}${why}`);

      if (route.type === 'capture') {
        window.dispatchEvent(new CustomEvent('ea:open-capture'));
        return;
      }

      if (route.type === 'tour') {
        startGuidedTour();
        return;
      }

      if (data.orchestration) {
        setOrchestration(data.orchestration);
        if (route.followUpHref) {
          setStatus(
            `${route.message} Review the agent summary below, then continue in the workspace.`,
          );
        }
        return;
      }

      if (data.orchestrationError) {
        setStatus(`${route.message} (${data.orchestrationError})`);
      }

      if (route.href) {
        window.location.href = route.href;
      }
    } catch {
      setStatus('Intent routing failed. Opening EA Voice.');
      sessionStorage.setItem('ea_voice_prefill', q);
      window.dispatchEvent(new CustomEvent('ea:open-voice'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <MissionControlExperience
        mission={mission}
        mode={mode}
        onIntentSubmit={handleIntent}
      />
      {busy ? (
        <p className="text-sm text-neutral-500 px-1">Routing intent…</p>
      ) : null}
      {status ? (
        <p className="text-sm text-neutral-700 bg-white border border-neutral-200 rounded px-4 py-3 leading-relaxed">
          {status}
        </p>
      ) : null}
      {orchestration?.response?.summary ? (
        <section className="bg-white border border-neutral-200 rounded p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Agent result
          </p>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap">
            {orchestration.response.summary}
          </p>
          {orchestration.response.recommendedNextSteps?.length ? (
            <ul className="text-sm text-neutral-600 list-disc pl-5 space-y-1">
              {orchestration.response.recommendedNextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : null}
          {orchestration.agents?.length ? (
            <p className="text-xs text-neutral-400">
              Agents: {orchestration.agents.map((a) => a.name).join(', ')}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
