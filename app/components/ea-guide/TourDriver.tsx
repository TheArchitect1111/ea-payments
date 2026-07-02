'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GuideTour, GuideTourStep } from '@/lib/ea-guide-types';
import './tour-driver.css';

type Props = {
  tour: GuideTour;
  open: boolean;
  initialStep?: number;
  onClose: (result: { completed: boolean; lastStepIndex: number }) => void;
};

function resolveElement(selector: string): Element | null {
  const parts = selector.split(',').map((s) => s.trim());
  for (const part of parts) {
    const el = document.querySelector(part);
    if (el) return el;
  }
  return null;
}

function Spotlight({ step }: { step: GuideTourStep }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [centered, setCentered] = useState(true);

  useEffect(() => {
    function update() {
      const el = resolveElement(step.element);
      if (!el || step.element === 'body') {
        setRect(null);
        setCentered(true);
        return;
      }
      setRect(el.getBoundingClientRect());
      setCentered(false);
    }
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const interval = window.setInterval(update, 400);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.clearInterval(interval);
    };
  }, [step]);

  if (centered || !rect) {
    return (
      <div className="ea-tour-backdrop ea-tour-backdrop-centered" aria-hidden="true">
        <div className="ea-tour-spotlight ea-tour-spotlight-centered" />
      </div>
    );
  }

  const pad = 8;
  const style = {
    top: Math.max(0, rect.top - pad),
    left: Math.max(0, rect.left - pad),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  return (
    <div className="ea-tour-backdrop" aria-hidden="true">
      <div className="ea-tour-spotlight" style={style} />
    </div>
  );
}

function Popover({
  step,
  stepIndex,
  total,
  onBack,
  onNext,
  onSkip,
}: {
  step: GuideTourStep;
  stepIndex: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const isLast = stepIndex >= total - 1;
  return (
    <div className="ea-tour-popover" role="dialog" aria-labelledby="ea-tour-title" aria-modal="true">
      <p className="ea-tour-meta">
        Walkthrough · {stepIndex + 1}/{total}
      </p>
      <h3 id="ea-tour-title">{step.title}</h3>
      <p>{step.description}</p>
      <div className="ea-tour-actions">
        <button type="button" className="ea-tour-skip" onClick={onSkip}>
          Skip
        </button>
        <div className="ea-tour-nav">
          {stepIndex > 0 ? (
            <button type="button" className="ea-tour-back" onClick={onBack}>
              Back
            </button>
          ) : null}
          <button type="button" className="ea-tour-next" onClick={onNext}>
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TourDriver({ tour, open, initialStep = 0, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(initialStep);
  const step = tour.steps[stepIndex];

  useEffect(() => {
    if (!open || !step?.route) return;
    if (window.location.pathname !== step.route) {
      window.history.pushState(null, '', step.route);
    }
  }, [open, step]);

  const finish = useCallback(
    (completed: boolean) => {
      onClose({ completed, lastStepIndex: stepIndex });
    },
    [onClose, stepIndex],
  );

  if (!open || !step) return null;

  return (
    <div className="ea-tour-root">
      <Spotlight step={step} />
      <Popover
        step={step}
        stepIndex={stepIndex}
        total={tour.steps.length}
        onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
        onNext={() => {
          if (stepIndex >= tour.steps.length - 1) finish(true);
          else setStepIndex((i) => i + 1);
        }}
        onSkip={() => finish(false)}
      />
    </div>
  );
}

export function startEAGuideTour(tourId: string) {
  window.dispatchEvent(new CustomEvent('ea-guide:start-tour', { detail: { tourId } }));
}
