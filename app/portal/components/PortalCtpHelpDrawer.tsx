'use client';

import { useEffect, useId, useState } from 'react';
import { CTP_FAQ_ITEMS } from '@/lib/ctp-faq';
import { GOLD, NAVY } from '@/lib/design-system';

/**
 * Self-serve Help / FAQ drawer for CTP portal pages.
 */
export default function PortalCtpHelpDrawer() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#faq') setOpen(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ep-ctp-help-fab"
        style={{
          position: 'fixed',
          right: '1.25rem',
          bottom: '1.25rem',
          zIndex: 80,
          border: 'none',
          borderRadius: '9999px',
          padding: '0.85rem 1.25rem',
          fontWeight: 800,
          fontSize: '0.8rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          backgroundColor: GOLD,
          color: NAVY,
          boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
          cursor: 'pointer',
        }}
      >
        Help / FAQ
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(8, 12, 24, 0.72)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, 100%)',
              height: '100%',
              background: '#0f172a',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              padding: '1.25rem 1.25rem 2rem',
              overflowY: 'auto',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: GOLD,
                  }}
                >
                  Self-serve help
                </p>
                <h2 id={titleId} style={{ margin: '0.35rem 0 0', fontSize: '1.35rem', color: '#fff' }}>
                  Answers before you ask
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  padding: '0.4rem 0.65rem',
                  cursor: 'pointer',
                  height: 'fit-content',
                }}
              >
                Close
              </button>
            </div>
            <p style={{ margin: '0 0 1.25rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, fontSize: '0.92rem' }}>
              Most questions are answered here so you can keep moving without waiting on email.
            </p>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {CTP_FAQ_ITEMS.map((item) => (
                <details
                  key={item.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0.75rem',
                    padding: '0.85rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: '#fff',
                      listStyle: 'none',
                    }}
                  >
                    {item.question}
                  </summary>
                  <p style={{ margin: '0.75rem 0 0', color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, fontSize: '0.9rem' }}>
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
