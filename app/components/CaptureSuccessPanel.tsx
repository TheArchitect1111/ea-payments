'use client';

import { useEffect, useState } from 'react';
import {
  openMagnifiExperience,
  shareAmplifiLink,
  type CaptureSuccessLinks,
} from '@/lib/capture-success-flow';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';
import StoryDraftPanel from '@/app/components/StoryDraftPanel';
import '@/app/components/story-draft-panel.css';

export default function CaptureSuccessPanel({
  title,
  links,
  amplifiDraft,
  onClose,
  autoOpenMagnifi = false,
}: {
  title: string;
  links: CaptureSuccessLinks;
  amplifiDraft?: AmplifiSocialDraft;
  onClose?: () => void;
  autoOpenMagnifi?: boolean;
}) {
  const [shareNote, setShareNote] = useState('');
  const [magnifiOpened, setMagnifiOpened] = useState(false);

  useEffect(() => {
    if (!autoOpenMagnifi || !links.magnifiUrl || magnifiOpened) return;
    const ok = openMagnifiExperience(links.magnifiUrl);
    setMagnifiOpened(ok);
    if (!ok) setShareNote('Preview was blocked. Use the Preview story button below.');
  }, [autoOpenMagnifi, links.magnifiUrl, magnifiOpened]);

  const openMagnifi = () => {
    if (!links.magnifiUrl) return;
    const ok = openMagnifiExperience(links.magnifiUrl);
    setMagnifiOpened(ok);
  };

  const shareStory = async () => {
    const shareUrl = links.considerUrl ?? links.magnifiUrl;
    if (!shareUrl) return;
    const result = await shareAmplifiLink(shareUrl, title);
    setShareNote(result === 'shared' ? 'Shared.' : 'Story link copied.');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">Capture complete</p>
      <div>
        <p className="font-bold text-[#1B2B4D]">{title}</p>
        <p className="mt-1 text-sm text-neutral-600">
          Simplifi saved the item. A shareable story was created automatically.
        </p>
      </div>

      <ol className="list-decimal space-y-1 pl-4 text-xs text-neutral-600">
        <li><strong>Saved:</strong> your item is now in Simplifi.</li>
        <li><strong>Summarized:</strong> the opportunity story is ready to review.</li>
        <li><strong>Next:</strong> copy the story link or preview it first.</li>
      </ol>

      <div className="flex flex-col gap-2">
        {(links.considerUrl || links.magnifiUrl) && (
          <button
            type="button"
            className="w-full rounded-full bg-[#C9A844] py-3 text-sm font-extrabold text-[#1B2B4D]"
            onClick={shareStory}
          >
            Copy or share story link
          </button>
        )}
        {links.magnifiUrl && (
          <button
            type="button"
            className="w-full rounded-full bg-[#1B2B4D] py-3 text-sm font-extrabold text-[#C9A844]"
            onClick={openMagnifi}
          >
            {magnifiOpened ? 'Preview story again' : 'Preview story'}
          </button>
        )}
        {links.guidanceUrl && (
          <a href={links.guidanceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#C9A844] underline">
            What should I do next?
          </a>
        )}
        {links.considerUrl && (
          <a href={links.considerUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#C9A844] underline">
            Open public story page
          </a>
        )}
        {links.workspaceUrl && (
          <a href={links.workspaceUrl} className="text-xs font-bold text-[#0A66FF] underline">
            View saved captures
          </a>
        )}
      </div>

      {amplifiDraft && <StoryDraftPanel draft={amplifiDraft} />}
      {shareNote && <p className="text-xs text-neutral-600">{shareNote}</p>}
      {links.clientMessage && (
        <pre className="whitespace-pre-wrap border bg-neutral-50 p-3 text-xs">{links.clientMessage}</pre>
      )}
      {onClose && (
        <button type="button" className="w-full py-2 text-sm font-semibold text-neutral-600" onClick={onClose}>
          Done
        </button>
      )}
    </div>
  );
}
