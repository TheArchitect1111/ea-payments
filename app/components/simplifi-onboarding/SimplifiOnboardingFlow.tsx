'use client';

import { useEffect, useState } from 'react';
import {
  getOnboardingStep,
  isOnboardingComplete,
  markOnboardingComplete,
  onboardingStepNumber,
  setOnboardingStep,
  type SimplifiOnboardingStep,
} from '@/lib/simplifi-onboarding';
import './simplifi-onboarding.css';

type Props = {
  scope: string;
  firstName?: string;
  onStartCapture?: () => void;
  onComplete?: () => void;
  externalStep?: SimplifiOnboardingStep | null;
  onExternalStepHandled?: () => void;
};

export default function SimplifiOnboardingFlow({
  scope,
  firstName = 'there',
  onStartCapture,
  onComplete,
  externalStep,
  onExternalStepHandled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SimplifiOnboardingStep>('flight-welcome');

  useEffect(() => {
    if (isOnboardingComplete(scope)) return;
    const current = getOnboardingStep(scope) ?? 'flight-welcome';
    if (current === 'first-capture') {
      setOpen(false);
      setStep('first-capture');
      return;
    }
    if (current !== 'complete') {
      setStep(current);
      setOpen(true);
    }
  }, [scope]);

  useEffect(() => {
    if (!externalStep) return;
    setStep(externalStep);
    setOpen(externalStep !== 'first-capture');
    onExternalStepHandled?.();
  }, [externalStep, onExternalStepHandled]);

  function goTo(next: SimplifiOnboardingStep, close = false) {
    setStep(next);
    setOnboardingStep(scope, next);
    setOpen(!close);
  }

  function finish() {
    markOnboardingComplete(scope);
    setOpen(false);
    onComplete?.();
  }

  if (isOnboardingComplete(scope) && !externalStep) return null;
  if (step === 'first-capture' && !open) return null;

  const displayName = firstName && firstName !== 'there' ? firstName : '';

  return (
    <>
      {open ? <div className="sob-backdrop" aria-hidden="true" /> : null}
      <div className={`sob-sheet${open ? ' sob-sheet-open' : ''}`} role="dialog" aria-modal={open} aria-labelledby="sob-title">
        {open ? <div className="sob-handle" aria-hidden="true" /> : null}
        {open && step !== 'complete' && step !== 'capture-success' ? (
          <p className="sob-progress">First Flight {onboardingStepNumber(step)} of 5</p>
        ) : null}

        {open && step === 'flight-welcome' && (
          <>
            <p className="sob-promise">Never Lose An Opportunity Again&trade;</p>
            <h2 id="sob-title" className="sob-title">
              Welcome{displayName ? `, ${displayName}` : ''}.
            </h2>
            <p className="sob-muted">
              Simplifi quietly captures, organizes and surfaces opportunities so you never lose them.
            </p>
            <button type="button" className="sob-btn sob-btn-primary" onClick={() => goTo('flight-orb')}>
              Continue
            </button>
          </>
        )}

        {open && step === 'flight-orb' && (
          <>
            <div className="sob-living-orb" aria-hidden="true">
              <span />
            </div>
            <h2 id="sob-title" className="sob-title">The Orb is your guide.</h2>
            <p className="sob-muted">
              Tap the Orb to see what matters. Long press to capture anything. Double tap for instant capture.
            </p>
            <button type="button" className="sob-btn sob-btn-primary" onClick={() => goTo('flight-brief')}>
              Continue
            </button>
          </>
        )}

        {open && step === 'flight-brief' && (
          <>
            <h2 id="sob-title" className="sob-title">The Brief stays quiet.</h2>
            <p className="sob-muted">
              The Brief shows only what deserves your attention today. No dashboards. No clutter. Just guidance.
            </p>
            <button type="button" className="sob-btn sob-btn-primary" onClick={() => goTo('flight-ai')}>
              Continue
            </button>
          </>
        )}

        {open && step === 'flight-ai' && (
          <>
            <h2 id="sob-title" className="sob-title">You capture. Simplifi organizes.</h2>
            <p className="sob-muted">
              AI recommends the next useful move and explains why when you ask.
            </p>
            <button type="button" className="sob-btn sob-btn-primary" onClick={() => goTo('flight-begin')}>
              Continue
            </button>
          </>
        )}

        {open && step === 'flight-begin' && (
          <>
            <h2 id="sob-title" className="sob-title">You&apos;re ready.</h2>
            <p className="sob-muted">
              No setup required. Start with the Orb, or capture the first thing worth remembering.
            </p>
            <button
              type="button"
              className="sob-btn sob-btn-primary"
              onClick={() => {
                finish();
                onStartCapture?.();
              }}
            >
              Capture something
            </button>
            <button type="button" className="sob-btn sob-btn-ghost" onClick={finish}>
              Begin quietly
            </button>
          </>
        )}

        {open && step === 'capture-success' && (
          <>
            <h2 id="sob-title" className="sob-title">Nice capture.</h2>
            <p className="sob-muted">Simplifi reviewed it and will surface the next useful move when it matters.</p>
            <button type="button" className="sob-btn sob-btn-primary" onClick={finish}>
              Continue
            </button>
          </>
        )}
      </div>
    </>
  );
}

export function triggerOnboardingCaptureSuccess(scope: string) {
  setOnboardingStep(scope, 'capture-success');
}
