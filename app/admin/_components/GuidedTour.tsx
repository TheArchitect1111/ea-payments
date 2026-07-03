'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useCallback, useEffect, useState } from 'react';
import type { GuidedTour } from '@/lib/guided-tours';
import { MISSION_CONTROL_TOUR } from '@/lib/guided-tours';

const STORAGE_KEY = 'ea:tour:mission-control-v1';

type Props = {
  tour?: GuidedTour;
  autoStart?: boolean;
};

export default function GuidedTourOverlay({ tour = MISSION_CONTROL_TOUR, autoStart = false }: Props) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const step = tour.steps[stepIndex];
  const isLast = stepIndex >= tour.steps.length - 1;

  const close = useCallback(() => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, 'done');
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onStart = () => start();
    window.addEventListener('ea:start-tour', onStart);
    return () => window.removeEventListener('ea:start-tour', onStart);
  }, [start]);

  useEffect(() => {
    if (!autoStart) return;
    if (localStorage.getItem(STORAGE_KEY) === 'done') return;
    const t = setTimeout(start, 800);
    return () => clearTimeout(t);
  }, [autoStart, start]);

  if (!open || !step) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(15,31,61,0.5)' }}
    >
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          Guided Tour · {stepIndex + 1}/{tour.steps.length}
        </p>
        <h3 className="text-lg font-bold mb-2" style={{ color: NAVY }}>
          {step.title}
        </h3>
        <p className="text-sm text-neutral-600 leading-relaxed mb-4">{step.body}</p>
        {step.href && (
          <a
            href={step.href}
            className="inline-block text-xs font-semibold mb-4 underline"
            style={{ color: GOLD }}
          >
            Open this surface →
          </a>
        )}
        <div className="flex justify-between items-center gap-2">
          <button type="button" onClick={close} className="text-xs text-neutral-400">
            Skip tour
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex((i) => i - 1)}
                className="px-3 py-1.5 text-xs border border-neutral-200 rounded"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) close();
                else setStepIndex((i) => i + 1);
              }}
              className="px-4 py-1.5 text-xs font-bold rounded text-white"
              style={{ backgroundColor: NAVY }}
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function startGuidedTour() {
  window.dispatchEvent(new CustomEvent('ea:start-tour'));
}
