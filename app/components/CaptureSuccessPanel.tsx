'use client';

import {
  capturePipelineSteps,
  openMagnifiExperience,
  shareAmplifiLink,
  type CaptureSuccessLinks,
} from '@/lib/capture-success-flow';
import { useEffect, useState } from 'react';

export default function CaptureSuccessPanel({
  title,
  links,
  onClose,
  autoOpenMagnifi = true,
}: {
  title: string;
  links: CaptureSuccessLinks;
  onClose?: () => void;
  autoOpenMagnifi?: boolean;
}) {
  const [shareNote, setShareNote] = useState('');
  const [magnifiOpened, setMagnifiOpened] = useState(false);

  useEffect(() => {
    if (!autoOpenMagnifi || !links.magnifiUrl || magnifiOpened) return;
    const ok = openMagnifiExperience(links.magnifiUrl);
    setMagnifiOpened(ok);
    if (!ok) setShareNote('Pop-up blocked — tap Open Magnifi below.');
  }, [autoOpenMagnifi, links.magnifiUrl, magnifiOpened]);

  const openMagnifi = () => {
    if (!links.magnifiUrl) return;
    const ok = openMagnifiExperience(links.magnifiUrl);
    setMagnifiOpened(ok);
  };

  const amplify = async () => {
    if (!links.considerUrl) return;
    const result = await shareAmplifiLink(links.considerUrl, title);
    setShareNote(result === 'shared' ? 'Shared via Amplifi.' : 'Consider link copied.');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">Simplifi → Magnifi → Amplifi</p>
      <p className="font-bold text-[#1B2B4D]">{title}</p>
      <ol className="text-xs text-neutral-600 space-y-1 list-decimal pl-4">
        {capturePipelineSteps().map((s) => (
          <li key={s.step}>
            <strong>{s.step}</strong> — {s.detail}
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2">
        {links.magnifiUrl && (
          <button
            type="button"
            className="w-full py-3 rounded-full font-extrabold text-sm bg-[#C9A844] text-[#1B2B4D]"
            onClick={openMagnifi}
          >
            {magnifiOpened ? 'Re-open Magnifi' : 'Open Magnifi cinematic'}
          </button>
        )}
        {links.considerUrl && (
          <button
            type="button"
            className="w-full py-3 rounded-full font-extrabold text-sm bg-[#1B2B4D] text-[#C9A844]"
            onClick={amplify}
          >
            Amplifi — share story link
          </button>
        )}
        {links.guidanceUrl && (
          <a href={links.guidanceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#C9A844] underline">
            Simplifi guidance →
          </a>
        )}
        {links.considerUrl && (
          <a href={links.considerUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#C9A844] underline">
            Open Consider page →
          </a>
        )}
      </div>
      {shareNote && <p className="text-xs text-neutral-600">{shareNote}</p>}
      {links.clientMessage && (
        <pre className="text-xs bg-neutral-50 border p-3 whitespace-pre-wrap">{links.clientMessage}</pre>
      )}
      {onClose && (
        <button type="button" className="w-full py-2 text-sm font-semibold text-neutral-600" onClick={onClose}>
          Done
        </button>
      )}
    </div>
  );
}
