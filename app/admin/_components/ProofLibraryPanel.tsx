'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import type { ProofStory } from '@/lib/proof-library';

export default function ProofLibraryPanel({
  stories,
  title = 'Proof Library™',
}: {
  stories: ProofStory[];
  title?: string;
}) {
  if (stories.length === 0) return null;

  return (
    <div className="border border-neutral-200 bg-white p-6 space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
        {title}
      </p>
      <p className="text-sm text-neutral-500">
        Similar transformations — proof that clarity and systems create measurable outcomes.
      </p>
      <div className="space-y-4">
        {stories.map((story) => (
          <div
            key={story.id}
            className="border-l-2 pl-4"
            style={{ borderColor: GOLD }}
          >
            <p className="text-sm font-bold" style={{ color: NAVY }}>
              {story.title}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {story.industry} · {story.pattern}
            </p>
            <p className="text-sm text-neutral-700 mt-2">{story.problem}</p>
            <p className="text-sm text-neutral-600 mt-1">{story.outcome}</p>
            <p className="text-xs font-semibold mt-2" style={{ color: GOLD }}>
              {story.metric}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
