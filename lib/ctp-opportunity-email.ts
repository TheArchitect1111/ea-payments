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
    let url = direct
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

function noticedRowsHtml(): string {
  const rows: Array<[string, string]> = [
    ['First impressions could be stronger.', 'Create greater confidence with visitors and potential customers.'],
    ['Your story could be communicated more clearly.', 'Help people quickly understand your value and what makes your organization unique.'],
    ['Customer interactions could be simplified.', 'Make it easier for people to contact you, schedule appointments, or become customers.'],
    ['Everyday work could become more organized.', 'Reduce unnecessary administrative effort so your team can focus on what matters most.'],
  ];
  return rows
    .map(([noticed, why]) => `<tr><td style="${td}">${esc(noticed)}</td><td style="${td}">${esc(why)}</td></tr>`)
    .join('');
}

function impactRowsHtml(model: CtpWelcomeEmailModel): string {
  const low = Math.max(8000, Math.round(model.opportunityLow * 0.25));
  const mid = Math.max(10000, Math.round(model.opportunityLow * 0.35));
  const high = Math.max(12000, Math.round(model.opportunityHigh * 0.4));
  const rows: Array<[string, string]> = [
    ['Customer Experience', `${moneyRange(mid, Math.round(mid * 2.5))} annually`],
    ['Business Operations', `${moneyRange(low, Math.round(low * 2.5))} annually`],
    ['Administrative Time Savings', `${Math.max(3, Math.round(model.weeklyTimeRecovery * 0.5))}-${Math.max(8, model.weeklyTimeRecovery)} hours each week`],
    ['Growth Opportunities', `${moneyRange(high, Math.round(high * 2.8))} annually`],
  ];
  return rows
    .map(([label, impact]) => `<tr><td style="${td}">${esc(label)}</td><td style="${tdRight}"><strong>${esc(impact)}</strong></td></tr>`)
    .join('');
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

export function buildOpportunityExperienceEmail(model: CtpWelcomeEmailModel): OpportunityConfirmationEmail {
  const first = esc(plain(model.firstName));
  const portalUrl = resolveCtpEmailPortalUrl(model);
  const annualLow = Math.max(30000, model.opportunityLow || 30000);
  const annualHigh = Math.max(annualLow + 10000, model.opportunityHigh || 80000);
  const investLow = model.investmentLow ?? 1497;
  const investHigh = Math.max(investLow, model.investmentHigh ?? 4995);

  const bodyHtml = plain(`
    <p style="${p}">Hello ${first},</p>
    <p style="${p}">Thank you for taking the time to share information about your organization through the Consider The Possibilities™ questionnaire.</p>
    <p style="${p}">We've started getting to know your business and have completed an initial review based on what you shared.</p>
    <p style="${p}">Your personalized portal is now ready and contains our first observations, recommendations, and next steps.</p>

    <p style="${section}">What We Learned</p>
    <p style="${p}">As we reviewed what you shared, a few opportunities began to stand out.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${tableWrap}">
      <tr>
        <th style="${th}">What We Noticed</th>
        <th style="${th}">Why It Matters</th>
      </tr>
      ${noticedRowsHtml()}
    </table>

    <p style="${section}">What This Could Mean</p>
    <p style="${p}">Small improvements in how your organization communicates, serves customers, and manages daily operations often create meaningful long-term results.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${tableWrap}">
      <tr>
        <th style="${th}">Opportunity</th>
        <th style="${thRight}">Estimated Impact</th>
      </tr>
      ${impactRowsHtml(model)}
    </table>
    <p style="${subhead}">Estimated Annual Opportunity</p>
    <p style="${p}"><strong>${esc(moneyRange(annualLow, annualHigh))}+</strong></p>

    <p style="${section}">Here's Where We'd Begin</p>
    <p style="${p}">Based on what we've learned so far, these are the areas we'd recommend focusing on first.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${tableWrap}">
      <tr>
        <th style="${th}">Recommended Solution</th>
        <th style="${thRight}">Estimated Build Time</th>
      </tr>
      ${beginRowsHtml()}
    </table>
    <p style="${subhead}">Estimated Project Effort</p>
    <p style="${p}"><strong>28-50 Hours</strong></p>
    <p style="${p}">Every organization is different. Some projects require a streamlined website and portal, while others include additional functionality, custom workflows, or specialized integrations. The estimated effort above reflects the size and complexity of your project.</p>
    <p style="${subhead}">Estimated Project Investment</p>
    <p style="${p}"><strong>Most organizations invest between ${esc(moneyRange(investLow, investHigh))}.</strong></p>
    <p style="${p}">The final investment depends on the size and complexity of your project. As we continue learning about your organization through your personalized portal, we'll refine the solution and provide a clear proposal before any work begins.</p>

    <p style="${section}">Continue the Conversation</p>
    <p style="${p}">We've only scratched the surface.</p>
    <p style="${p}">Your personalized portal is where we'll continue learning about your organization so every recommendation becomes more tailored to your goals.</p>
    <ul style="margin:0 0 18px;padding:0 0 0 20px;font-size:15px;color:#1A1A2E;line-height:1.8;">
      <li>Review our observations</li>
      <li>Share additional information</li>
      <li>Upload documents and branding</li>
      <li>Track project progress</li>
      <li>Communicate directly with our team</li>
    </ul>
    <p style="margin:18px 0 0;font-size:13px;color:#555;">Questions? Reply to this email or reach us at <a href="mailto:${esc(model.supportEmail)}" style="color:#1B2B4D;">${esc(model.supportEmail)}</a>.</p>
  `);

  const result: OpportunityConfirmationEmail = {
    subject: plain(`We've started getting to know your organization`),
    title: plain(`Thank You`),
    eyebrow: 'Consider The Possibilities™',
    ctaLabel: 'Open My Personalized Portal',
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