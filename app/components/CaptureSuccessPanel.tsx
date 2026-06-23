'use client';

import { useState } from 'react';
import {
  openMagnifiExperience,
  shareAmplifiLink,
  type CaptureSuccessLinks,
} from '@/lib/capture-success-flow';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';

export default function CaptureSuccessPanel({
  title,
  links,
  amplifiDraft: _amplifiDraft,
  onClose,
  onContinue,
}: {
  title: string;
  links: CaptureSuccessLinks;
  amplifiDraft?: AmplifiSocialDraft;
  onClose?: () => void;
  onContinue?: () => void;
  autoOpenMagnifi?: boolean;
}) {
  const [shareNote, setShareNote] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const actions = [
    'Add to Watch List',
    'Set Reminder',
    'Follow Up Later',
    'Share With Someone',
    'Create Amplifi Story',
    'Continue Browsing',
  ];

  function toggleAction(label: string) {
    setSelectedActions((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  const openMagnifi = () => {
    if (!links.magnifiUrl) return;
    openMagnifiExperience(links.magnifiUrl);
  };

  const shareStory = async () => {
    const shareUrl = links.considerUrl ?? links.magnifiUrl;
    if (!shareUrl) return;
    const result = await shareAmplifiLink(shareUrl, title);
    setShareNote(result === 'shared' ? 'Shared.' : 'Link copied.');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">Nice capture</p>
      <div>
        <p className="text-lg font-extrabold text-[#1B2B4D]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Your opportunity has been saved. Simplifi reviewed it and created a summary. Now you can decide what happens
          next.
        </p>
      </div>

      <div className="space-y-2">
        {actions.map((label) => (
          <label
            key={label}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-[#FAF8F3] px-3 py-3 text-sm font-semibold text-neutral-800"
          >
            <input
              type="checkbox"
              checked={selectedActions.includes(label)}
              onChange={() => toggleAction(label)}
              className="h-4 w-4"
            />
            {label}
          </label>
        ))}
      </div>

      {selectedActions.includes('Create Amplifi Story') && links.magnifiUrl ? (
        <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
          <button
            type="button"
            className="w-full rounded-full bg-[#1B2B4D] py-3 text-sm font-extrabold text-[#C9A844]"
            onClick={openMagnifi}
          >
            Preview your story
          </button>
          {(links.considerUrl || links.magnifiUrl) && (
            <button
              type="button"
              className="w-full rounded-full border border-neutral-200 py-3 text-sm font-bold text-[#1B2B4D]"
              onClick={shareStory}
            >
              Share with someone
            </button>
          )}
        </div>
      ) : null}

      {links.workspaceUrl && (
        <a href={links.workspaceUrl} className="block text-center text-xs font-bold text-[#1B2B4D] underline">
          View all saved opportunities
        </a>
      )}

      {shareNote ? <p className="text-xs text-neutral-600">{shareNote}</p> : null}

      <button
        type="button"
        className="w-full rounded-full bg-[#C9A844] py-3 text-sm font-extrabold text-[#1B2B4D]"
        onClick={() => {
          onContinue?.();
          onClose?.();
        }}
      >
        Continue
      </button>
    </div>
  );
}
