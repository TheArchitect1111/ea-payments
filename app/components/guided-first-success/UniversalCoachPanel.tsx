'use client';

import { useState } from 'react';
import {
  type EAPlatformId,
  GUIDED_PLATFORMS,
} from '@/lib/guided-first-success';
import './guided-first-success.css';

export default function UniversalCoachPanel({ platformId }: { platformId: EAPlatformId }) {
  const [open, setOpen] = useState(false);
  const config = GUIDED_PLATFORMS[platformId];

  return (
    <>
      <button
        type="button"
        className="uc-fab"
        aria-label="Open Guide coach"
        onClick={() => setOpen((v) => !v)}
      >
        Guide
      </button>
      {open && (
        <div className="uc-panel" role="dialog" aria-label="Universal AI Coach">
          <h3>Guide™ — What&apos;s next?</h3>
          <p className="gfs-muted" style={{ margin: 0 }}>
            Your coach for {config.name}. Tap a question.
          </p>
          {config.coachPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="uc-prompt"
              onClick={() => {
                if (prompt.includes('capture') || prompt.includes('Capture')) {
                  window.location.href = '/capture';
                } else if (prompt.includes('Magnifi') || prompt.includes('share')) {
                  window.location.href = '/amplify';
                } else if (prompt.includes('attention')) {
                  window.location.href = '/portal/demo-client';
                }
              }}
            >
              {prompt}
            </button>
          ))}
          <button type="button" className="gfs-btn gfs-btn-ghost" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      )}
    </>
  );
}
