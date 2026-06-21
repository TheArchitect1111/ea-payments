'use client';

import { useState } from 'react';
import type { ExperienceTheme } from '@/lib/ea-template-registry';

export default function SimplifiGuidePanel({
  prompts,
  theme,
}: {
  prompts: { question: string; answer: string }[];
  theme: ExperienceTheme;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-sm">
      {open && (
        <div
          className="w-full border shadow-2xl p-5 space-y-3"
          style={{ backgroundColor: '#fff', borderColor: `${theme.navy}22` }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: theme.accent }}>
            Simplifi&trade; AI Guide
          </p>
          <p className="text-sm text-neutral-600">Your advisor for this assessment.</p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt, index) => (
              <button
                key={prompt.question}
                type="button"
                onClick={() => setActive(index)}
                className="text-left text-[11px] font-semibold px-3 py-2 border border-neutral-200 hover:border-neutral-400"
                style={{ color: theme.navy }}
              >
                {prompt.question}
              </button>
            ))}
          </div>
          {active != null && (
            <p className="text-sm leading-relaxed p-4" style={{ backgroundColor: theme.cream, color: theme.navy }}>
              {prompts[active]?.answer}
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-5 py-4 text-xs font-black uppercase tracking-[0.2em] shadow-lg"
        style={{ backgroundColor: theme.navy, color: theme.gold }}
      >
        {open ? 'Close Guide' : 'Ask Simplifi Guide'}
      </button>
    </div>
  );
}
