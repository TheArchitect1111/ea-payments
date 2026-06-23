'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  SIMPLIFI_FLOW_STEPS,
  WATCH_LIST_CATEGORIES,
  WATCH_LIST_EXAMPLES,
  getOnboardingStep,
  isOnboardingComplete,
  markOnboardingComplete,
  onboardingStepNumber,
  saveActiveWatchList,
  saveWatchCategories,
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
  const [step, setStep] = useState<SimplifiOnboardingStep>('welcome');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [watchEntries, setWatchEntries] = useState<string[]>([]);
  const [watchInput, setWatchInput] = useState('');

  useEffect(() => {
    if (isOnboardingComplete(scope)) return;
    const current = getOnboardingStep(scope) ?? 'welcome';
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

  function toggleCategory(id: string) {
    setSelectedCategories((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function addWatchEntry(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setWatchEntries((current) => (current.includes(trimmed) ? current : [...current, trimmed]));
    setWatchInput('');
  }

  function finish() {
    markOnboardingComplete(scope);
    setOpen(false);
    onComplete?.();
  }

  if (isOnboardingComplete(scope) && !externalStep) return null;
  if (step === 'first-capture' && !open) return null;

  const displayName = firstName && firstName !== 'there' ? firstName : 'there';

  return (
    <>
      {open ? <div className="sob-backdrop" aria-hidden="true" /> : null}
      <div className={`sob-sheet${open ? ' sob-sheet-open' : ''}`} role="dialog" aria-modal={open} aria-labelledby="sob-title">
        {open ? <div className="sob-handle" aria-hidden="true" /> : null}
        {open && step !== 'complete' ? (
          <p className="sob-progress">Step {onboardingStepNumber(step)} of 7</p>
        ) : null}

        {open && step === 'welcome' && (
          <>
            <p className="sob-promise">Never Lose An Opportunity Again™</p>
            <h2 id="sob-title" className="sob-title">
              Welcome to Simplifi™
            </h2>
            <p className="sob-lede">The place where opportunities stop slipping through the cracks.</p>
            <p className="sob-muted">
              Every day we find things worth remembering — a person, a business, an event, an idea. Most disappear.
              Simplifi helps you save them, organize them, and act on them when the time is right.
            </p>
            <button type="button" className="sob-btn sob-btn-primary" onClick={() => goTo('interests')}>
              Let&apos;s Begin
            </button>
          </>
        )}

        {open && step === 'interests' && (
          <>
            <h2 className="sob-title">What interests you?</h2>
            <p className="sob-lede">What kinds of opportunities do you want Simplifi to help you track?</p>
            <p className="sob-muted">Select all that apply.</p>
            <div className="sob-grid">
              {WATCH_LIST_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`sob-chip${selectedCategories.includes(category.id) ? ' sob-chip-active' : ''}`}
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="sob-btn sob-btn-primary"
              disabled={selectedCategories.length === 0}
              onClick={() => {
                saveWatchCategories(scope, selectedCategories);
                goTo('watchlist');
              }}
            >
              Continue
            </button>
          </>
        )}

        {open && step === 'watchlist' && (
          <>
            <h2 className="sob-title">What&apos;s on your Watch List?</h2>
            <p className="sob-lede">What are you actively looking for right now?</p>
            <div className="sob-examples">
              {WATCH_LIST_EXAMPLES.map((example) => (
                <button key={example} type="button" className="sob-example" onClick={() => addWatchEntry(example)}>
                  {example}
                </button>
              ))}
            </div>
            <input
              className="sob-input"
              value={watchInput}
              onChange={(event) => setWatchInput(event.target.value)}
              placeholder="Type what you're looking for…"
              onKeyDown={(event) => {
                if (event.key === 'Enter') addWatchEntry(watchInput);
              }}
            />
            {watchEntries.length > 0 ? (
              <ul className="sob-list">
                {watchEntries.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              className="sob-btn sob-btn-primary"
              disabled={watchEntries.length === 0}
              onClick={() => {
                saveActiveWatchList(scope, watchEntries);
                goTo('first-capture', true);
                onStartCapture?.();
              }}
            >
              Continue to first capture
            </button>
            <button type="button" className="sob-btn sob-btn-ghost" onClick={() => goTo('first-capture', true)}>
              Skip for now
            </button>
          </>
        )}

        {open && step === 'capture-success' && (
          <>
            <h2 className="sob-title">Nice capture.</h2>
            <p className="sob-lede">Your opportunity has been saved.</p>
            <p className="sob-muted">
              Simplifi reviewed it and created a summary. Now you can decide what happens next.
            </p>
            <div className="sob-actions-grid">
              {[
                'Add to Watch List',
                'Set Reminder',
                'Follow Up Later',
                'Share With Someone',
                'Create Amplifi Story',
                'Continue Browsing',
              ].map((label) => (
                <button key={label} type="button" className="sob-action-card" onClick={() => goTo('explain')}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="sob-btn sob-btn-primary" onClick={() => goTo('explain')}>
              Continue
            </button>
          </>
        )}

        {open && step === 'explain' && (
          <>
            <h2 className="sob-title">Here&apos;s how Simplifi helps.</h2>
            <div className="sob-flow">
              {SIMPLIFI_FLOW_STEPS.map((item, index) => (
                <span key={item}>
                  {item}
                  {index < SIMPLIFI_FLOW_STEPS.length - 1 ? ' ↓ ' : ''}
                </span>
              ))}
            </div>
            <p className="sob-muted">
              The goal isn&apos;t to save more things. The goal is to act on the right things. Simplifi helps you
              remember what matters and move opportunities forward.
            </p>
            <Link href="/simplifi/workspace" className="sob-btn sob-btn-primary" onClick={finish}>
              Take Me To My Dashboard
            </Link>
          </>
        )}
      </div>
    </>
  );
}

export function triggerOnboardingCaptureSuccess(scope: string) {
  setOnboardingStep(scope, 'capture-success');
}
