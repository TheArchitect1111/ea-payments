/**
 * Consider The Possibilities confirmation email.
 * Hospitality first — observations live in Journey / Your Project, not the inbox.
 * Never use em dashes. Prefer hyphens or plain punctuation.
 */
import type { CtpClientType } from '@/lib/ctp-client-type';
import { opportunityDashboardPublicUrl } from '@/lib/ctp-opportunity-routes';
import { publicPortalLoginUrl } from '@/lib/ctp-portal-host';
import {
  opportunityEmailHealthRows,
  opportunityEmailReadiness,
  opportunityEmailSummary,
} from '@/lib/ctp-opportunity-view';
import type { CtpSubmission } from '@/lib/ctp-submissions';
import type { CtpWelcomeEmailModel } from '@/lib/ctp-welcome-email';

export type OpportunityConfirmationEmail = {
  subject: string;
  title: string;
  eyebrow: string;
  ctaLabel: string;
  ctaUrl: string;
  bodyHtml: string;
};

const FORBIDDEN_EMAIL_TERMS = [
  'Automation',
  'Assessment',
  'Capacity',
  'Readiness score',
  'Operational maturity',
  'Open My Workspace',
  'Executive Brief',
  'Project Scope',
  'Website Package',
  'Design Studio',
] as const;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plain(s: string): string {
  return s.replace(/\u2014/g, '-').replace(/\u2013/g, '-');
}

const p = `margin:0 0 14px;font-size:15px;color:#1A1A2E;line-height:1.75;`;

export function resolveCtpEmailPortalUrl(model: CtpWelcomeEmailModel): string {
  const direct = model.portalUrl?.trim();
  if (direct) {
    let url = direct
      .replace(/^https?:\/\/www\.efficiencyarchitects\.online/i, 'https://efficiencyarchitects.online')
      .replace(/^https?:\/\/cc\.efficiencyarchitects\.online/i, 'https://efficiencyarchitects.online');
    if (/efficiencyarchitects\.online\/ctp\/?(\?|$)/i.test(url)) {
      return publicPortalLoginUrl();
    }
    return url;
  }
  return publicPortalLoginUrl();
}

export function buildOpportunityExperienceEmail(model: CtpWelcomeEmailModel): OpportunityConfirmationEmail {
  const first = esc(plain(model.firstName));
  const portalUrl = resolveCtpEmailPortalUrl(model);

  const bodyHtml = plain(`
    <p style="${p}">Hello ${first},</p>
    <p style="${p}">Thank you for sharing your organization with us through Consider The Possibilities™.</p>
    <p style="${p}">We've started getting to know you - and Your Project is ready. Everything that matters next lives there, calmly, in one place.</p>
    <p style="${p}">When you open it, you'll see where things stand and what we're preparing. No homework. No rush.</p>
    <p style="margin:18px 0 0;font-size:13px;color:#555;">Questions? Reply to this email or reach us at <a href="mailto:${esc(model.supportEmail)}" style="color:#1B2B4D;">${esc(model.supportEmail)}</a>.</p>
  `);

  const result: OpportunityConfirmationEmail = {
    subject: plain(`We've started getting to know your organization`),
    title: plain(`You're expected`),
    eyebrow: 'Consider The Possibilities™',
    ctaLabel: 'Open Your Project',
    ctaUrl: portalUrl,
    bodyHtml,
  };

  assertOpportunityEmailLanguage(result);
  return result;
}

export function buildOpportunityEmailModelFromSubmission(
  submission: CtpSubmission,
  options: {
    portalUrl?: string | null;
    proposalUrl: string;
    supportEmail: string;
    capacityScore: number;
    scoreBand: string;
    weeklyTimeRecovery: number;
    opportunityLow: number;
    opportunityHigh: number;
    projectTypeLabel: string;
    recommendedFee: number;
    investmentLow: number;
    investmentHigh: number;
    timelineLabel: string;
    scopePhases?: string[];
    clientType: CtpClientType;
  },
): CtpWelcomeEmailModel {
  const firstName = submission.contactName.split(' ')[0] || submission.contactName;
  const portalUrl =
    options.portalUrl?.trim() ||
    (submission.portalSlug ? opportunityDashboardPublicUrl(submission.portalSlug) : undefined);

  return {
    firstName,
    businessName: submission.businessName,
    contactName: submission.contactName,
    capacityScore: opportunityEmailReadiness(submission) ?? options.capacityScore,
    scoreBand: options.scoreBand,
    weeklyTimeRecovery: options.weeklyTimeRecovery,
    opportunityLow: options.opportunityLow,
    opportunityHigh: options.opportunityHigh,
    projectTypeLabel: options.projectTypeLabel,
    recommendedFee: options.recommendedFee,
    timelineLabel: options.timelineLabel,
    investmentLow: options.investmentLow,
    investmentHigh: options.investmentHigh,
    scopePhases: options.scopePhases,
    portalUrl,
    proposalUrl: options.proposalUrl,
    supportEmail: options.supportEmail,
    includesPortal:
      options.clientType === 'website_portal' || options.clientType === 'portal_only',
    clientType: options.clientType,
    opportunitySummary: opportunityEmailSummary(submission),
    categoryScores: opportunityEmailHealthRows(submission),
  };
}

export function assertOpportunityEmailLanguage(email: OpportunityConfirmationEmail): void {
  const cta = email.ctaUrl;
  const hitsMarketingCtp = /efficiencyarchitects\.online\/ctp\/?(\?|$)/i.test(cta);
  const okCta =
    !hitsMarketingCtp &&
    (cta.includes('/portal/') || cta.includes('portal/login') || /\/login(?:\?|$)/.test(cta));
  if (!okCta) {
    throw new Error('Opportunity email CTA must target a branded portal or portal login.');
  }
  const staticCopy = `${email.subject} ${email.title} ${email.ctaLabel}`;
  for (const term of FORBIDDEN_EMAIL_TERMS) {
    if (staticCopy.includes(term)) {
      throw new Error(`Opportunity email must not include forbidden term: ${term}`);
    }
  }
  if (staticCopy.includes('\u2014')) {
    throw new Error('Opportunity email must not include em dashes.');
  }
}
