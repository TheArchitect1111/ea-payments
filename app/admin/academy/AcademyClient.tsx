'use client';

import { useState } from 'react';
import { ACADEMY_MODULES } from '@/lib/academy-modules';
import { startGuidedTour } from '../_components/GuidedTour';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export default function AcademyClient() {
  const [activeId, setActiveId] = useState(ACADEMY_MODULES[0]?.id ?? '');
  const activeModule = ACADEMY_MODULES.find((m) => m.id === activeId) ?? ACADEMY_MODULES[0];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
            Learn EA Academy™
          </p>
          <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
            Role-based EA onboarding
          </h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
            Short modules for operators, partners, and client teams. Each module follows the EA
            mission loop — discover, clarify, act.
          </p>
        </div>
        <button
          type="button"
          onClick={startGuidedTour}
          className="text-xs font-bold px-4 py-2 rounded border border-neutral-200 hover:border-neutral-400"
          style={{ color: NAVY }}
        >
          Replay Mission Control tour
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {ACADEMY_MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveId(m.id)}
              className={`w-full text-left p-4 border rounded transition ${
                activeId === m.id
                  ? 'border-neutral-400 bg-white shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <p className="text-sm font-bold" style={{ color: NAVY }}>
                {m.title}
              </p>
              <p className="text-xs text-neutral-500 mt-1">{m.duration}</p>
            </button>
          ))}
        </div>

        {activeModule && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-neutral-200 p-6">
              <h3 className="text-xl font-extrabold mb-2" style={{ color: NAVY }}>
                {activeModule.title}
              </h3>
              <p className="text-sm text-neutral-600">{activeModule.summary}</p>
            </div>

            {activeModule.lessons.map((lesson) => (
              <div key={lesson.title} className="bg-white border border-neutral-200 p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
                  {lesson.title}
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed">{lesson.content}</p>
              </div>
            ))}

            {activeModule.cta && (
              <a
                href={activeModule.cta.href}
                className="inline-block text-xs font-bold px-4 py-2 rounded text-white"
                style={{ backgroundColor: NAVY }}
              >
                {activeModule.cta.label} →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
