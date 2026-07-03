'use client';

import { useEffect, useState } from 'react';
import { MissionControlExperience } from '@ea/portal-chassis/mission-control-experience';
import type { MissionControlResponse } from '@ea/portal-chassis/mission-control';
import {
  executeIntentRoute,
  submitAdminIntent,
  type OrchestrationPayload,
} from '@/lib/admin-intent-client';
import {
  readOperatingMode,
  type OperatingMode,
} from '@/lib/admin-operating-mode';
import { startGuidedTour } from '../_components/GuidedTour';

export default function MissionControlPanel({ mission }: { mission: MissionControlResponse }) {
  const [mode, setMode] = useState<OperatingMode>('executive');
  const [missionData, setMissionData] = useState(mission);
  const [missionLoading, setMissionLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [orchestration, setOrchestration] = useState<OrchestrationPayload | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const initial = readOperatingMode();
    setMode(initial);

    const onMode = (e: Event) => {
      const detail = (e as CustomEvent<OperatingMode>).detail;
      if (detail) setMode(detail);
    };
    window.addEventListener('ea:operating-mode-change', onMode);
    return () => window.removeEventListener('ea:operating-mode-change', onMode);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMissionLoading(true);

    fetch(`/api/mission-control?mode=${mode}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MissionControlResponse | null) => {
        if (!cancelled && data) setMissionData(data);
      })
      .catch(() => {
        if (!cancelled) setMissionData(mission);
      })
      .finally(() => {
        if (!cancelled) setMissionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, mission]);

  const handleIntent = async (intent: string) => {
    const q = intent.trim();
    if (!q) return;

    setBusy(true);
    setStatus(null);
    setOrchestration(null);

    try {
      const data = await submitAdminIntent(q);
      const result = executeIntentRoute(data, { onTour: startGuidedTour });
      setStatus(result.status);
      setOrchestration(result.orchestration);
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
        mission={missionData}
        mode={mode}
        onIntentSubmit={handleIntent}
      />
      {missionLoading ? (
        <p className="text-sm text-neutral-500 px-1">Updating Mission Control for {mode} mode…</p>
      ) : null}
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
