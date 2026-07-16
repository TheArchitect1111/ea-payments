/**
 * EA Opportunity Experience™ — Phase 2 confirmation email.
 * One structure for all CTP tracks; dynamic snapshot from submission data only.
 */
import type { CtpClientType } from '@/lib/ctp-client-type';
import { opportunityDashboardPublicUrl } from '@/lib/ctp-opportunity-routes';
import {
  opportunityEmailHealthRows,
  opportunityEmailReadiness,
  opportunityEmailStars,
  opportunityEmailSummary,
  opportunityFoundationRows,
} from '@/lib/ctp-opportunity-view';
import type { CtpSubmission } from '@/lib/ctp-submissions';
import { ctpWelcomeEmailTrack, type CtpWelcomeEmailModel } from '@/lib/ctp-welcome-email';

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
  'Workflow',
  'Backend',
  'CMS',
  'API',
  'Infrastructure',
  'Deployment',
  'Design Studio',
  'Open My Workspace',
  'Client Portal',
  'Executive Brief',
  'Project Scope',
  'Website Package',
] as const;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function starRow(count: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(count)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

const th = `padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#6B7280;border-bottom:1px solid #E8E2D6;text-align:left;background:#FAF8F4;`;
const td = `padding:12px 14px;font-size:14px;color:#1A1A2E;border-bottom:1px solid #E8E2D6;vertical-align:top;line-height:1.5;`;
const section = `margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#1B2B4D;`;
const p = `margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.75;`;
const hero = `margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.35;color:#1B2B4D;letter-spacing:-0.02em;`;

function foundationForModel(model: CtpWelcomeEmailModel): Array<{ included: string; why: string }> {
  const stub = {
    clientType: model.clientType,
    clientTypeClassification: {
      clientType: model.clientType ?? 'website',
      label: '',
      confidence: 1,
      reasons: [],
      portalRequired: Boolean(model.includesPortal) || model.clientType === 'portal_only',
      websiteRequired:
        ctpWelcomeEmailTrack(model.clientType) === 'presence' ||
        model.clientType === 'website_portal',
      businessIntelligence: false,
      digitalAudit: false,
    },
  } as Pick<CtpSubmission, 'clientType' | 'clientTypeClassification'>;
  return opportunityFoundationRows(stub).slice(0, 7);
}

function resolveCtaUrl(model: CtpWelcomeEmailModel): string {
  if (model.portalUrl?.trim()) return model.portalUrl.trim();
  throw new Error('Opportunity confirmation email requires portalUrl — provision workspace before send.');
}

/**
 * Build Stage One confirmation email HTML (all CTP clients).
 */
export function buildOpportunityExperienceEmail(model: CtpWelcomeEmailModel): OpportunityConfirmationEmail {
  const first = esc(model.firstName);
  const business = esc(model.businessName);
  const dashboardUrl = resolveCtaUrl(model);
  const readiness = model.capacityScore;
  const stars = opportunityEmailStars(readiness);
  const summary =
    model.opportunitySummary?.trim() ||
    `Your organization has a strong foundation with clear growth potential. Our initial review identified opportunities to improve customer experience, strengthen your online presence, and simplify everyday operations.`;
  const healthRows = model.categoryScores ?? [];
  const foundation = foundationForModel(model);

  const healthTable =
    healthRows.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><th style="${th}">Area</th><th style="${th}">Score</th></tr>
      ${healthRows
        .map(
          (row) =>
            `<tr><td style="${td}">${esc(row.label)}</td><td style="${td}"><strong>${row.score}</strong></td></tr>`,
        )
        .join('')}
    </table>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><td style="${td}">Overall Readiness</td><td style="${td}"><strong>${readiness} / 100</strong></td></tr>
      <tr><td style="${td}">Journey band</td><td style="${td}"><strong>${esc(model.scoreBand)}</strong></td></tr>
    </table>`;

  const foundationRows = foundation
    .map(
      (row) =>
        `<tr><td style="${td}"><strong>${esc(row.included)}</strong></td><td style="${td}">${esc(row.why)}</td></tr>`,
    )
    .join('');

  const bodyHtml = `
    <p style="${hero}">Let's Build Something You'll Be Proud To Share.</p>
    <p style="${p}">Hello ${first},</p>
    <p style="${p}">Thank you for completing the Consider the Possibilities™ Assessment.</p>
    <p style="${p}margin-bottom:22px;">We've already begun analyzing what you shared about ${business}. Your Opportunity Dashboard is ready — a clear picture of where things stand today, and where growth is possible next.</p>

    <p style="${section}">Project Status</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><th style="${th}">Step</th><th style="${th}">Status</th></tr>
      <tr><td style="${td}">Assessment Received</td><td style="${td}"><strong>✅ Complete</strong></td></tr>
      <tr><td style="${td}">Initial Review</td><td style="${td}"><strong>✅ Complete</strong></td></tr>
      <tr><td style="${td}">Opportunity Analysis</td><td style="${td}"><strong>✅ Complete</strong></td></tr>
      <tr><td style="${td}">Opportunity Dashboard Ready</td><td style="${td}"><strong>✅ Ready</strong></td></tr>
    </table>

    <p style="${section}">Project Snapshot</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:12px;">
      <tr><td style="${td}">Overall Readiness Score</td><td style="${td}"><strong>${readiness} / 100</strong></td></tr>
      <tr><td style="${td}">Opportunity Rating</td><td style="${td}"><strong>${starRow(stars)}</strong></td></tr>
    </table>
    ${healthTable}

    <p style="${section}">Opportunity Summary</p>
    <p style="${p}margin-bottom:22px;">${esc(summary)}</p>

    <p style="${section}">Your Digital Foundation</p>
    <p style="${p}">Every project includes a professional website experience and a private management portal — shaped around what your organization actually needs.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><th style="${th}">Included</th><th style="${th}">Why It Matters</th></tr>
      ${foundationRows}
    </table>

    <p style="${section}">Typical Investment</p>
    <p style="${p}">Investment depends on features and functionality. Every project includes both a professional website and a private management portal.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><th style="${th}">Organization</th><th style="${th}">Typical Investment</th></tr>
      <tr><td style="${td}">Nonprofit Organizations</td><td style="${td}"><strong>Starting at $997</strong></td></tr>
      <tr><td style="${td}">Businesses &amp; Organizations</td><td style="${td}"><strong>Starting at $1,497</strong></td></tr>
      <tr><td style="${td}">Larger Multi-System Projects</td><td style="${td}"><strong>Custom Proposal</strong></td></tr>
    </table>

    <p style="${p}">Open your Opportunity Dashboard to see what we've discovered about ${business}.</p>
    <p style="margin:18px 0 0;font-size:13px;color:#555;">Questions? Reply to this email or reach us at <a href="mailto:${esc(model.supportEmail)}" style="color:#1B2B4D;">${esc(model.supportEmail)}</a>.</p>
  `;

  const result: OpportunityConfirmationEmail = {
    subject: `Let's Build Something You'll Be Proud To Share.`,
    title: `Let's Build Something You'll Be Proud To Share.`,
    eyebrow: 'Consider The Possibilities™',
    ctaLabel: 'VIEW MY OPPORTUNITY DASHBOARD',
    ctaUrl: dashboardUrl,
    bodyHtml,
  };

  assertOpportunityEmailLanguage(result);
  return result;
}

/** Build confirmation email model fields from a live CTP submission. */
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

/** Guardrail: confirmation email must use business language only. */
export function assertOpportunityEmailLanguage(email: OpportunityConfirmationEmail): void {
  const blob = `${email.subject} ${email.title} ${email.ctaLabel} ${email.bodyHtml}`;
  for (const term of FORBIDDEN_EMAIL_TERMS) {
    if (blob.includes(term)) {
      throw new Error(`Opportunity email must not include forbidden term: ${term}`);
    }
  }
  if (!email.ctaUrl.includes('/ctp') && !email.ctaUrl.includes('portal/login')) {
    throw new Error('Opportunity email CTA must target Opportunity Dashboard or portal login.');
  }
}
