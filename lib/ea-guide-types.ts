/**
 * EA Guide™ — shared guidance layer types.
 */

export type EAPortalType =
  | 'pulse'
  | 'passport'
  | 'discover'
  | 'client'
  | 'admin'
  | 'training'
  | 'family'
  | 'volunteer'
  | 'event'
  | 'landing'
  | 'simplifi'
  | 'magnifi'
  | 'cpr'
  | 'update-hub'
  | 'portal'
  | 'unknown';

export type EAUserRole =
  | 'guest'
  | 'client'
  | 'owner'
  | 'admin'
  | 'staff'
  | 'volunteer'
  | 'family'
  | 'learner';

export type EAOrbState =
  | 'idle'
  | 'new-user'
  | 'needs-action'
  | 'tour-available'
  | 'question'
  | 'walkthrough'
  | 'escalation';

export type GuideTrigger =
  | 'first_login'
  | 'first_visit'
  | 'manual'
  | 'incomplete_step'
  | 'recommended';

export interface GuideTourStep {
  element: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  route?: string;
}

export interface GuideTour {
  tourId: string;
  title: string;
  description?: string;
  portalType?: EAPortalType;
  routePattern: string;
  roles?: EAUserRole[];
  trigger: GuideTrigger;
  steps: GuideTourStep[];
  estimatedMinutes?: number;
}

export interface GuideProgress {
  userId: string;
  organizationId?: string;
  tourId: string;
  completedAt?: string;
  skippedAt?: string;
  lastStepIndex?: number;
}

export interface KnowledgeEntry {
  id: string;
  topic: string;
  portalType?: EAPortalType;
  keywords: string[];
  question: string;
  answer: string;
  related?: string[];
  nextSteps?: string[];
}

export interface EscalationDraft {
  page: string;
  portalType: EAPortalType;
  role: EAUserRole;
  organizationId?: string;
  userId?: string;
  workflow?: string;
  issueSummary: string;
  details?: string;
  screenshotDataUrl?: string;
}

export type EscalationStatus = 'open' | 'in_progress' | 'resolved';

export interface EscalationRecord extends EscalationDraft {
  id: string;
  source: 'ea-guide';
  status: EscalationStatus;
  createdAt: string;
}

export interface GuidePageContext {
  portalType: EAPortalType;
  role: EAUserRole;
  pathname: string;
  label: string;
  workflow?: string;
  organizationId?: string;
  userId?: string;
}

export const EA_GUIDE_PROGRESS_KEY = 'ea-guide-progress-v1';
export const EA_GUIDE_FIRST_LOGIN_KEY = 'ea-guide-first-login-complete-v1';
export const EA_GUIDE_USER_KEY = 'ea-guide-user-v1';
export const EA_GUIDE_GUIDE_ATTEMPT_KEY = 'ea-guide-guide-attempt-v1';
