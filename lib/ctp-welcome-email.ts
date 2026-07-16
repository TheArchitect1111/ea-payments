/**
 * CTP welcome email track helpers + shared model type.
 * HTML builder: lib/ctp-opportunity-email.ts (Phase 2).
 */
import type { CtpClientType } from '@/lib/ctp-client-type';
import { opportunityEmailPathSuffix } from '@/lib/ctp-opportunity-routes';
import { buildOpportunityExperienceEmail } from '@/lib/ctp-opportunity-email';

export type CtpWelcomeEmailTrack = 'ops' | 'presence';

export function ctpWelcomeEmailTrack(clientType: CtpClientType | undefined | null): CtpWelcomeEmailTrack {
  if (clientType === 'website' || clientType === 'website_portal') return 'presence';
  return 'ops';
}

export function ctpWelcomeStudioPath(_track?: CtpWelcomeEmailTrack): string {
  return opportunityEmailPathSuffix();
}

export type CtpWelcomeEmailModel = {
  firstName: string;
  businessName: string;
  contactName: string;
  capacityScore: number;
  scoreBand: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  projectTypeLabel: string;
  recommendedFee: number;
  timelineLabel: string;
  investmentLow: number;
  investmentHigh: number;
  portalUrl?: string | null;
  proposalUrl: string;
  supportEmail: string;
  includesPortal?: boolean;
  scopePhases?: string[];
  clientType?: CtpClientType;
  opportunitySummary?: string;
  categoryScores?: Array<{ label: string; score: number }>;
};

export {
  assertOpportunityEmailLanguage,
  buildOpportunityEmailModelFromSubmission,
  buildOpportunityExperienceEmail,
  type OpportunityConfirmationEmail,
} from '@/lib/ctp-opportunity-email';

export function buildOpsWelcomeEmail(model: CtpWelcomeEmailModel) {
  return buildOpportunityExperienceEmail(model);
}

export function buildPresenceWelcomeEmail(model: CtpWelcomeEmailModel) {
  return buildOpportunityExperienceEmail({
    ...model,
    includesPortal: model.includesPortal ?? model.clientType === 'website_portal',
  });
}
