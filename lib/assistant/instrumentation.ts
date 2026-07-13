import type { AssistantSurface } from './types';

export type AssistantEventName =
  | 'assistant.opened'
  | 'assistant.closed'
  | 'assistant.action_clicked'
  | 'assistant.guidance_selected'
  | 'assistant.question_submitted'
  | 'assistant.ask_success'
  | 'assistant.ask_failure';

export type AssistantEventPayload = {
  event: AssistantEventName;
  surface: AssistantSurface;
  pathname: string;
  userId?: string;
  organizationId?: string;
  actionId?: string;
  questionLength?: number;
  error?: string;
};

export function trackAssistantEvent(payload: AssistantEventPayload): void {
  if (typeof window === 'undefined') return;

  const body = {
    ...payload,
    at: new Date().toISOString(),
  };

  void fetch('/api/ea-assistant/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Instrumentation must never interrupt the assistant experience.
  });
}
