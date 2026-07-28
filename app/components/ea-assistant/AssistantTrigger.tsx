'use client';

import { useAssistantLabels } from './assistant-labels';

type AssistantTriggerProps = {
  open: boolean;
  showBadge: boolean;
  onToggle: () => void;
};

export default function AssistantTrigger({ open, showBadge, onToggle }: AssistantTriggerProps) {
  const labels = useAssistantLabels();
  return (
    <button
      type="button"
      className="ea-assistant-trigger"
      onClick={onToggle}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={open ? labels.close : labels.trigger}
    >
      {labels.trigger}
      {showBadge && !open ? <span className="ea-assistant-badge" aria-hidden="true" /> : null}
      {showBadge && !open ? <span className="sr-only">Attention needed</span> : null}
    </button>
  );
}
