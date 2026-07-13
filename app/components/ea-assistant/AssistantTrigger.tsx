'use client';

import { ASSISTANT_LABELS } from '@/lib/assistant/constants';

type AssistantTriggerProps = {
  open: boolean;
  showBadge: boolean;
  onToggle: () => void;
};

export default function AssistantTrigger({ open, showBadge, onToggle }: AssistantTriggerProps) {
  return (
    <button
      type="button"
      className="ea-assistant-trigger"
      onClick={onToggle}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={open ? ASSISTANT_LABELS.close : ASSISTANT_LABELS.trigger}
    >
      {ASSISTANT_LABELS.trigger}
      {showBadge && !open ? <span className="ea-assistant-badge" aria-hidden="true" /> : null}
      {showBadge && !open ? <span className="sr-only">Attention needed</span> : null}
    </button>
  );
}
