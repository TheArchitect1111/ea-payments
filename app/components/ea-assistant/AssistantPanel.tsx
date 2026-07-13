'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import { ASSISTANT_LABELS } from '@/lib/assistant/constants';

type AssistantPanelProps = {
  open: boolean;
  title: string;
  eyebrow: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
};

export default function AssistantPanel({
  open,
  title,
  eyebrow,
  subtitle,
  onClose,
  children,
}: AssistantPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="ea-assistant-backdrop"
        aria-label={ASSISTANT_LABELS.close}
        onClick={onClose}
      />
      <section
        ref={panelRef}
        className="ea-assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="ea-assistant-panel-head">
          <div>
            <p className="ea-assistant-eyebrow">{eyebrow}</p>
            <h2 id={titleId} className="ea-assistant-title">
              {title}
            </h2>
            <p className="ea-assistant-subtitle">{subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ea-assistant-icon-btn"
            onClick={onClose}
            aria-label={ASSISTANT_LABELS.close}
          >
            ×
          </button>
        </header>
        <div className="ea-assistant-body">{children}</div>
      </section>
    </>
  );
}
