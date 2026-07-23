import type { AssistantSurface } from './types';

export const ASSISTANT_LABELS = {
  trigger: 'Help',
  briefTitle: 'Advisor Brief',
  getGuidance: 'Get Guidance',
  viewDetails: 'View Details',
  backToBrief: 'Back to Brief',
  askPlaceholder: 'Ask about this page or workflow…',
  send: 'Send',
  close: 'Close assistant',
  today: 'Today',
  aboutPage: 'About this page',
  organization: 'Organization signals',
  wins: 'Recent wins',
  escalationHint: 'Need more help? Your question can be escalated to the EA team.',
  askFailure:
    "I'm temporarily unable to answer that question. You can still use the recommended actions below, or try again in a moment.",
} as const;

/** String-valued label bag — allows CX hospitality overrides without literal-type clash. */
export type AssistantLabels = {
  -readonly [K in keyof typeof ASSISTANT_LABELS]: string;
};

/** Client Experience chrome — hospitality, not advisor software. */
export const CX_ASSISTANT_LABELS: AssistantLabels = {
  ...ASSISTANT_LABELS,
  trigger: 'Need a hand?',
  briefTitle: 'Here for you',
  getGuidance: 'Ask a question',
  viewDetails: 'See more',
  backToBrief: 'Back',
  askPlaceholder: 'Ask about Your Project…',
  aboutPage: 'About this moment',
  organization: 'Your Project',
  wins: 'Recent moments',
  escalationHint: 'Need a person? Contact reaches your guide within one business day.',
  askFailure:
    'I’m briefly unavailable. Your Project still has your next step — or Contact your guide.',
};

export const ASSISTANT_STORAGE_KEY = 'ea-assistant-dismissed-v1';

export const SURFACE_EYEBROW: Record<AssistantSurface, string> = {
  portal: 'Portal Advisor',
  discover: 'Discovery Guide',
  admin: 'Mission Control Advisor',
};

export const CX_SURFACE_EYEBROW = 'Client Experience';
