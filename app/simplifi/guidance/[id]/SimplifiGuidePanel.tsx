'use client';

import { useState } from 'react';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export default function SimplifiGuidePanel({
  prompts,
}: {
  prompts: { question: string; answer: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-sm">
      {open && (
        <div
          className="w-full border shadow-2xl p-5 space-y-3"
          style={{ backgroundColor: '#fff', borderColor: 'rgba(27,43,77,0.15)' }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            Simplifi&trade; AI Guide
          </p>
          <p className="text-sm text-neutral-600">Your advisor for this assessment — ask anything below.</p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt, index) => (
              <button
                key={prompt.question}
                type="button"
                onClick={() => setActive(index)}
                className="text-left text-[11px] font-semibold px-3 py-2 border border-neutral-200 hover:border-neutral-400"
                style={{ color: NAVY }}
              >
                {prompt.question}
              </button>
            ))}
          </div>
          {active != null && (
            <p className="text-sm leading-relaxed p-4" style={{ backgroundColor: '#FAF8F3', color: NAVY }}>
              {prompts[active]?.answer}
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-5 py-4 text-xs font-black uppercase tracking-[0.2em] shadow-lg"
        style={{ backgroundColor: NAVY, color: GOLD }}
      >
        {open ? 'Close Guide' : 'Ask Simplifi Guide'}
      </button>
    </div>
  );
}
