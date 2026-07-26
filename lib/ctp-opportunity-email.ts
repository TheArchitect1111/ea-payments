/**
 * Consider The Possibilities confirmation email.
 * Guided consulting voice - not an assessment report.
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

function moneyRange(low: number, high: number): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(n)));
  return `${fmt(low)}-${fmt(high)}`;
}

const th = `padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#6B7280;border-bottom:1px solid #E8E2D6;text-align:left;background:#FAF8F4;`;
const thRight = `${th}text-align:right;`;
const td = `padding:12px 14px;font-size:14px;color:#1A1A2E;border-bottom:1px solid #E8E2D6;vertical-align:top;line-height:1.5;`;
const tdRight = `${td}text-align:right;`;
const section = `margin:28px 0 10px;font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#1B2B4D;`;
const p = `margin:0 0 14px;font-size:15px;color:#1A1A2E;line-height:1.75;`;
const subhead = `margin:18px 0 8px;font-size:15px;font-weight:700;color:#1B2B4D;`;
const tableWrap = `border:1px solid #E8E2D6;margin:0 0 18px;`;

export function resolveCtpEmailPortalUrl(model: CtpWelcomeEmailModel): string {
  const direct = model.portalUrl?.trim();
  if (direct) {
    // Rewrite www/cc → apex so clients never land on the CRA marketing site.
    const url = direct
      .replace(/^https?:\/\/www\.efficiencyarchitects\.online/i, 'https://efficiencyarchitects.online')
      .replace(/^https?:\/\/cc\.efficiencyarchitects\.online/i, 'https://efficiencyarchitects.online');
    // Bare /ctp on apex redirects to public CTP intake — never use as portal CTA.
    if (/efficiencyarchitects\.online\/ctp\/?(\?|$)/i.test(url)) {
      return publicPortalLoginUrl();
    }
    // Prefer branded portal paths; login is acceptable only as last resort.
    if (url.includes('/portal/')) return url;
    return url;
  }
  return publicPortalLoginUrl();
}

function beginRowsHtml(): string {
  const rows: Array<[string, string]> = [
    ['Story-Driven Website', '10-18 hrs'],
    ['Client Management Portal', '8-14 hrs'],
    ['Customer Engagement Tools', '4-8 hrs'],
    ['Launch & Optimization', '6-10 hrs'],
  ];
  return rows
    .map(([solution, hours]) => `<tr><td style="${td}">${esc(solution)}</td><td style="${tdRight}"><strong>${esc(hours)}</strong></td></tr>`)
    .join('');
}

function healthRowsHtml(model: CtpWelcomeEmailModel): string {
  const rows = model.categoryScores ?? [];
  if (!rows.length) {
    return `<tr><td style="${td}">Initial review</td><td style="${tdRight}"><strong>Complete</strong></td></tr>`;
  }
  return rows
    .map(
      ({ label, score }) =>
        `<tr><td style="${td}">${esc(label)}</td><td style="${tdRight}"><strong>${Math.round(score)}/100</strong></td></tr>`,
    )
    .join('');
}

export function buildOpportunityExperienceEmail(model: CtpWelcomeEmailModel): OpportunityConfirmationEmail {
  const first = esc(plain(model.firstName));
  const portalUrl = resolveCtpEmailPortalUrl(model);
  const annualLow = Math.max(30000, model.opportunityLow || 30000);
  const annualHigh = Math.max(annualLow + 10000, model.opportunityHigh || 80000);
  const investLow = model.investmentLow ?? 1497;
  const investHigh = Math.max(investLow, model.investmentHigh ?? 4995);

  const bodyHtml = plain(`
    <p style="${p}">Hello ${first},</p>
    <p style="${p}">Thank you for sharing information about your organization through Consider The Possibilities™.</p>
    <p style="${p}">We've completed your initial review and prepared a private Opportunity Dashboard with our first observations, recommendations, and next steps.</p>

    <p style="${section}">Project Status</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${tableWrap}">
      <tr><td style="${td}">Assessment Received</td><td style="${tdRight}"><strong>Complete</strong></td></tr>
      <tr><td style="${td}">Initial Review</td><td style="${tdRight}"><strong>Complete</strong></td></tr>
      <tr><td style="${td}">Opportunity Dashboard Ready</td><td style="${tdRight}"><strong>Ready</strong></td></tr>
    </table>

    <p style="${section}">Executive Snapshot</p>
    <p style="${subhead}">Overall Readiness Score</p>
    <p style="${p}"><strong>${Math.round(model.capacityScore)}/100 · ${esc(model.scoreBand)}</strong></p>
    <p style="${subhead}">Opportunity Rating</p>
    <p style="${p}"><strong>${esc(model.scoreBand)}</strong></p>
    <p style="${subhead}">Opportunity Summary</p>
    <p style="${p}">${esc(model.opportunitySummary || `Our initial review identified meaningful opportunities for ${model.businessName}.`)}</p>

    <p style="${section}">Your Digital Foundation</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${tableWrap}">
      <tr>
        <th style="${th}">Area</th>
        <th style="${thRight}">Current Score</th>
      </tr>
      ${healthRowsHtml(model)}
    </table>
    <p style="${p}">Why It Matters: a clear, credible digital foundation helps people understand your value, trust your organization, and take the next step.</p>

    <p style="${section}">Estimated Project Scope</p>
    <p style="${p}">These are the four areas we would begin with, subject to refinement during discovery.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${tableWrap}">
      <tr>
        <th style="${th}">Recommended Solution</th>
        <th style="${thRight}">Estimated Effort</th>
      </tr>
      ${beginRowsHtml()}
    </table>
    <p style="${subhead}">Total Estimated Effort</p>
    <p style="${p}"><strong>28-50 Hours</strong></p>
    <p style="${p}">Every organization is different. The estimate reflects the anticipated size and complexity of your project and will be refined before work begins.</p>

    <p style="${section}">Typical Investment</p>
    <p style="${p}"><strong>Nonprofit Organizations: Starting at $997</strong><br/><strong>Other Organizations: Starting at $1,497</strong></p>
    <p style="${p}">Most projects fall between ${esc(moneyRange(investLow, investHigh))}, depending on size and complexity. You will receive a Custom Proposal before making any commitment.</p>

    <p style="${section}">Estimated Opportunity</p>
    <p style="${p}">The potential annual opportunity identified in this initial review is <strong>${esc(moneyRange(annualLow, annualHigh))}+</strong>.</p>
    <p style="${p}">Open your dashboard to review the complete Project Snapshot and continue with one clear next step.</p>
    <p style="margin:18px 0 0;font-size:13px;color:#555;">Questions? Reply to this email or reach us at <a href="mailto:${esc(model.supportEmail)}" style="color:#1B2B4D;">${esc(model.supportEmail)}</a>.</p>
  `);

  const result: OpportunityConfirmationEmail = {
    subject: plain(`Your Opportunity Dashboard is ready`),
    title: plain(`Let's Build Something You'll Be Proud To Share.`),
    eyebrow: 'Consider The Possibilities™',
    ctaLabel: 'VIEW MY OPPORTUNITY DASHBOARD',
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
