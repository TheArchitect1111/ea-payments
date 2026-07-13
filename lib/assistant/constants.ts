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

export const ASSISTANT_STORAGE_KEY = 'ea-assistant-dismissed-v1';

export const SURFACE_EYEBROW: Record<AssistantSurface, string> = {
  portal: 'Portal Advisor',
  discover: 'Discovery Guide',
  admin: 'Mission Control Advisor',
};
