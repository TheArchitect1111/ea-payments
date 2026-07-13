import type { EAGuideAction } from '@/lib/ea-guide';
import type { GuidePageContext } from '@/lib/ea-guide-types';

export type AssistantSurface = 'portal' | 'discover' | 'admin';

export type AssistantLevel = 'brief' | 'guidance' | 'details';

export interface AdvisorBriefDetails {
  today: string[];
  aboutPage: string;
  organization: string[];
  wins: string[];
}

export interface AdvisorBriefModel {
  greeting: string;
  pageLabel: string;
  situation: string;
  recommendation: string;
  recommendationDetail: string;
  why: string;
  whyBullets: string[];
  primaryAction?: EAGuideAction;
  secondaryAction?: EAGuideAction;
  badgeLabel?: string;
  needsAttention: boolean;
  details: AdvisorBriefDetails;
  pageContext: GuidePageContext;
  contextId: string;
}

export interface GuidanceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: 'high' | 'medium' | 'low';
  nextSteps?: string[];
  suggestEscalation?: boolean;
}

export interface DiscoverSignal {
  id: string;
  question: string;
  helper: string;
  sectionTitle: string;
  progressMessage: string;
  pageLabel: string;
  answer: string;
  reviewMode: boolean;
}

export interface AskGuideResponse {
  answer: string;
  entryId?: string;
  topic?: string;
  nextSteps?: string[];
  confidence: 'high' | 'medium' | 'low';
  suggestEscalation: boolean;
  context: GuidePageContext;
}
