import { EA_PLATFORM_URL } from './platform-urls';
import { sendEmail } from '@ea/portal-chassis/email';
import { getAdminNotificationEmail } from './integration-env';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';

export interface WelcomeEmailData {
  clientName: string;
  email: string;
  packageName: string;
  portalLoginUrl: string;
  tempCredentials?: string;
  platformName?: string;
  nextSteps?: string;
  siteUrl?: string;
  /** One-click portal login (longer TTL when issued from purchase webhook). */
  magicLoginUrl?: string;
  /** When true, copy reflects immediate auto-provision (website + portal). */
  readyNow?: boolean;
}

export interface AdminNotificationData {
  clientName: string;
  organization?: string;
  email: string;
  packageName: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethodTypes: string[];
  stripeTransactionId: string;
  airtableRecordId?: string;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nextStepsForPackage(packageName: string): string {
  if (packageName === 'Capacity Assessment') {
    return 'Our team will contact you within 1 business day to schedule your intake call and begin your organizational assessment.';
  }
  if (packageName === 'Capacity Blueprint') {
    return 'We will review your assessment data and begin building your custom roadmap. Expect a strategy call to be scheduled within 2 business days.';
  }
  if (packageName === 'Implementation Package') {
    return 'Your dedicated advisor will reach out within 1 business day to kick off onboarding, review your blueprint, and schedule your first implementation session.';
  }
  return 'Our team will reach out within 1 business day to schedule your onboarding call.';
}

function buildWelcomeHtml(params: {
  clientName: string;
  packageName: string;
  portalLoginUrl: string;
  supportEmail: string;
  tempCredentials: string;
  nextSteps: string;
  year: number;
  platformName: string;
}): string {
  const { clientName, packageName, portalLoginUrl, supportEmail, tempCredentials, nextSteps, year, platformName } =
    params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Welcome to ${escHtml(platformName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:40px 20px;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#FFFFFF;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#1B2B4D;padding:32px 40px;text-align:center;">
      <p style="margin:0;color:#C9A844;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">${escHtml(platformName)}</p>
      <h1 style="margin:10px 0 0;color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:1px;">Welcome</h1>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:40px;">
      <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(clientName)},</p>
      <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">
        Thank you for purchasing the <strong>${escHtml(packageName)}</strong>. We are glad to have you as a client of Efficiency Architects and look forward to working together.
      </p>

      <!-- NEXT STEPS -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="background-color:#F0F2F5;border-left:4px solid #C9A844;padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#1B2B4D;">Next Steps</p>
            <p style="margin:0;font-size:14px;color:#1A1A2E;line-height:1.7;">${escHtml(nextSteps)}</p>
          </td>
        </tr>
      </table>

      <!-- PORTAL CTA -->
      <p style="margin:28px 0 12px;font-size:15px;color:#1A1A2E;line-height:1.7;">
        When your client portal is ready, you can access it here:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color:#1B2B4D;border-radius:2px;">
            <a href="${escHtml(portalLoginUrl)}" target="_blank" style="display:inline-block;padding:13px 30px;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Access Your Portal</a>
          </td>
        </tr>
      </table>
      <p style="margin:18px 0 0;font-size:13px;color:#555555;line-height:1.7;">${escHtml(tempCredentials)}</p>

      <!-- DIVIDER -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
        <tr><td style="border-top:1px solid #E4E4E4;font-size:0;">&nbsp;</td></tr>
      </table>

      <p style="margin:0;font-size:13px;color:#555555;line-height:1.7;">
        Questions? Reach us at <a href="mailto:${escHtml(supportEmail)}" style="color:#1B2B4D;text-decoration:underline;">${escHtml(supportEmail)}</a>.
      </p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background-color:#1B2B4D;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:10px;color:#8896AF;letter-spacing:2px;text-transform:uppercase;">
        ${escHtml(platformName)} &copy; ${year}
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildAdminHtml(data: AdminNotificationData): string {
  const tableId = process.env.AIRTABLE_CLIENT_RECORDS_TABLE_ID;
  let airtableUrl: string;
  if (tableId && data.airtableRecordId) {
    airtableUrl = `https://airtable.com/${AIRTABLE_BASE_ID}/${tableId}/${data.airtableRecordId}`;
  } else if (tableId) {
    airtableUrl = `https://airtable.com/${AIRTABLE_BASE_ID}/${tableId}`;
  } else {
    airtableUrl = `https://airtable.com/${AIRTABLE_BASE_ID}`;
  }

  const methodDisplay =
    data.paymentMethodTypes.length > 0
      ? data.paymentMethodTypes
          .map((m) => m.replace(/_/g, ' '))
          .join(', ')
      : 'N/A';

  const rows: [string, string][] = [
    ['Client Name', data.clientName],
    ['Organization', data.organization || 'N/A'],
    ['Email', data.email],
    ['Package', data.packageName],
    ['Amount Paid', `$${data.amountPaid.toFixed(2)}`],
    ['Payment Date', data.paymentDate],
    ['Payment Methods', methodDisplay],
    ['Stripe Transaction ID', data.stripeTransactionId],
  ];

  const rowsHtml = rows
    .map(
      ([label, value], i) =>
        `<tr style="background-color:${i % 2 === 0 ? '#FFFFFF' : '#F8F9FB'};">
          <td style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555555;border-bottom:1px solid #E4E4E4;vertical-align:top;width:40%;">${escHtml(label)}</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A2E;border-bottom:1px solid #E4E4E4;vertical-align:top;word-break:break-all;">${escHtml(String(value))}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>New Client Payment Received</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:40px 20px;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#FFFFFF;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#1B2B4D;padding:24px 40px;">
      <p style="margin:0;color:#C9A844;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Efficiency Architects Admin</p>
      <h1 style="margin:8px 0 0;color:#FFFFFF;font-size:18px;font-weight:700;">New Client Payment Received</h1>
    </td>
  </tr>

  <!-- DATA TABLE -->
  <tr>
    <td style="padding:32px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;">
        <tr style="background-color:#F0F2F5;">
          <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555555;border-bottom:1px solid #E4E4E4;width:40%;">Field</td>
          <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555555;border-bottom:1px solid #E4E4E4;">Value</td>
        </tr>
        ${rowsHtml}
      </table>

      <!-- AIRTABLE LINK -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
        <tr>
          <td>
            <p style="margin:0 0 12px;font-size:13px;color:#555555;">View this record in Airtable:</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#1B2B4D;border-radius:2px;">
                  <a href="${escHtml(airtableUrl)}" target="_blank" style="display:inline-block;padding:11px 24px;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Open in Airtable</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background-color:#1B2B4D;padding:16px 40px;text-align:center;">
      <p style="margin:0;font-size:10px;color:#8896AF;letter-spacing:2px;text-transform:uppercase;">Efficiency Architects - Internal Notification</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function resendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    const missing = [!apiKey && 'RESEND_API_KEY', !from && 'RESEND_FROM_EMAIL']
      .filter(Boolean)
      .join(', ');
    console.warn(`Email not sent: missing env vars: ${missing}`);
    return { ok: false, error: `Email not configured (missing: ${missing}).` };
  }

  try {
    await sendEmail({ to, subject, html, from });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown network error.' };
  }
}

export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<{ ok: boolean; error?: string }> {
  const supportEmail =
    process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';

  const platformName = data.platformName ?? 'Efficiency Architects';

  const tempCredentials =
    data.tempCredentials ??
    'Your portal is being prepared. You will receive access details as soon as they are ready.';

  const firstName = data.clientName.split(' ')[0] || data.clientName;
  const nextSteps =
    data.nextSteps ??
    nextStepsForPackage(data.packageName);

  if (data.readyNow) {
    const siteBlock = data.siteUrl
      ? `<div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:18px 20px;margin-bottom:22px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1B2B4D;">Your Live Website</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;"><a href="${escHtml(data.siteUrl)}" style="color:#1B2B4D;text-decoration:underline;">${escHtml(data.siteUrl)}</a></p>
    </div>`
      : '';
    const magicBlock = data.magicLoginUrl
      ? `<div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:18px 20px;margin-bottom:22px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1B2B4D;">One-Click Portal Login</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">Use this secure link to open your portal (valid for 48 hours):</p>
      <p style="margin:12px 0 0;"><a href="${escHtml(data.magicLoginUrl)}" style="color:#1B2B4D;font-weight:700;text-decoration:underline;">Sign in to my portal</a></p>
    </div>`
      : '';
    const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">You are live, ${escHtml(firstName)}.</p>
    <p style="margin:0 0 22px;font-size:15px;color:#1A1A2E;line-height:1.7;">Your <strong>${escHtml(data.packageName)}</strong> website and client portal are ready now — no waiting for a build queue.</p>
    ${siteBlock}
    ${magicBlock}
    <div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:18px 20px;margin-bottom:22px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1B2B4D;">What To Do Next</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">${escHtml(nextSteps)}</p>
    </div>
    <div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:18px 20px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1B2B4D;">Password Backup</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">${escHtml(tempCredentials)}</p>
      <p style="margin:10px 0 0;font-size:12px;color:#777;">Prefer email login later? Use magic link from the portal login page. Temporary password works as a backup.</p>
    </div>
    <p style="margin:22px 0 0;font-size:13px;color:#555;line-height:1.7;">Questions? Reply to this email or reach us at <a href="mailto:${escHtml(supportEmail)}" style="color:#1B2B4D;text-decoration:underline;">${escHtml(supportEmail)}</a>.</p>`;

    const ctaUrl = data.magicLoginUrl || data.siteUrl || data.portalLoginUrl;
    const ctaLabel = data.magicLoginUrl
      ? 'Sign In To Portal'
      : data.siteUrl
        ? 'Open My Website'
        : 'Access My Portal';

    return resendEmail(
      data.email,
      `You are live, ${firstName}. Your website and portal are ready.`,
      baseEmailShell({
        title: 'You Are Live',
        eyebrow: platformName,
        bodyHtml,
        ctaLabel,
        ctaUrl,
      }),
    );
  }

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">You are in, ${escHtml(firstName)}. We are excited to begin this work with you.</p>
    <p style="margin:0 0 22px;font-size:15px;color:#1A1A2E;line-height:1.7;">A reminder of what you are getting: <strong>${escHtml(data.packageName)}</strong>, guided project support, launch visibility, and access to your client portal.</p>
    <div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:18px 20px;margin-bottom:22px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1B2B4D;">What Happens Next</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">${escHtml(nextSteps)}</p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin-bottom:22px;">
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Within 24 hours</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">You receive your project timeline and milestone plan.</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Week 1</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">Architecture and design begin.</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Week 2+</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">Build and integration move forward.</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Final</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">Review, approval, training, and launch.</td></tr>
    </table>
    <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1B2B4D;">What to expect from us.</p>
    <ul style="margin:0 0 22px;padding-left:20px;font-size:14px;color:#1A1A2E;line-height:1.7;">
      <li>Responsive communication.</li>
      <li>Clear visibility into each milestone.</li>
      <li>No surprises before anything launches.</li>
    </ul>
    <div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:18px 20px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1B2B4D;">Portal Access</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">${escHtml(tempCredentials)}</p>
      <p style="margin:10px 0 0;font-size:12px;color:#777;">This is a temporary password. You will be prompted to create a new one on your first login.</p>
    </div>
    <p style="margin:22px 0 0;font-size:13px;color:#555;line-height:1.7;">Questions? Reply to this email or reach us at <a href="mailto:${escHtml(supportEmail)}" style="color:#1B2B4D;text-decoration:underline;">${escHtml(supportEmail)}</a>.</p>`;

  return resendEmail(
    data.email,
    `You are in, ${firstName}. Here is what happens next.`,
    baseEmailShell({
      title: 'You Are In',
      eyebrow: platformName,
      bodyHtml,
      ctaLabel: 'Access My Portal',
      ctaUrl: data.portalLoginUrl,
    })
  );
}

export async function sendAdminNotification(
  data: AdminNotificationData
): Promise<{ ok: boolean; error?: string }> {
  const to =
    process.env.ADMIN_NOTIFICATION_EMAIL ?? 'freedom@efficiencyarchitects.online';

  const html = buildAdminHtml(data);
  return resendEmail(to, 'New Client Payment Received', html);
}

export interface AssessmentNotificationData {
  businessName: string;
  contactName: string;
  email: string;
  teamSize: number;
  revenueRange: string;
  operationalChallenges: string[];
  workflowCount: number;
  automationCount: number;
  integrationCount: number;
  dashboardRequired: boolean;
  portalRequired: boolean;
  userCount: number;
  businessComplexity: string;
  capacityScore: number;
  scoreBand: string;
  primaryConstraint: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  recommendedProjectType: string;
  projectTypeLabel: string;
  rawFee: number;
  recommendedFee: number;
  assessmentRecordId?: string;
  proposalRecordId?: string;
}

function buildAssessmentAdminHtml(data: AssessmentNotificationData): string {
  const assessmentsTableId = process.env.AIRTABLE_ASSESSMENTS_TABLE_ID ?? 'tblbDbNP5PCMojNe1';
  const proposalsTableId = process.env.AIRTABLE_PROPOSALS_TABLE_ID ?? 'tbl3P26zyteiPNLQY';

  const assessmentUrl = data.assessmentRecordId
    ? `https://airtable.com/${AIRTABLE_BASE_ID}/${assessmentsTableId}/${data.assessmentRecordId}`
    : `https://airtable.com/${AIRTABLE_BASE_ID}/${assessmentsTableId}`;

  const proposalUrl = data.proposalRecordId
    ? `https://airtable.com/${AIRTABLE_BASE_ID}/${proposalsTableId}/${data.proposalRecordId}`
    : `https://airtable.com/${AIRTABLE_BASE_ID}/${proposalsTableId}`;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const contactRows: [string, string][] = [
    ['Business Name', data.businessName],
    ['Contact Name', data.contactName],
    ['Email', data.email],
    ['Team Size', String(data.teamSize)],
    ['Revenue Range', data.revenueRange],
    ['Business Complexity', data.businessComplexity],
  ];

  const scopeRows: [string, string][] = [
    ['Workflows', String(data.workflowCount)],
    ['Automations', String(data.automationCount)],
    ['Integrations', String(data.integrationCount)],
    ['Dashboard Required', data.dashboardRequired ? 'Yes' : 'No'],
    ['Portal Required', data.portalRequired ? 'Yes' : 'No'],
    ['User Count', String(data.userCount)],
  ];

  const analysisRows: [string, string][] = [
    ['Capacity Score', String(data.capacityScore)],
    ['Score Band', data.scoreBand],
    ['Primary Constraint', data.primaryConstraint],
    ['Weekly Time Recovery', `${data.weeklyTimeRecovery} hrs/week`],
    ['Opportunity Range', `${fmt(data.opportunityLow)} - ${fmt(data.opportunityHigh)} / year`],
  ];

  const pricingRows: [string, string][] = [
    ['Project Type', data.projectTypeLabel],
    ['Raw Fee', fmt(data.rawFee)],
    ['Recommended Fee', fmt(data.recommendedFee)],
  ];

  function renderRows(rows: [string, string][], startIndex = 0): string {
    return rows
      .map(
        ([label, value], i) =>
          `<tr style="background-color:${(i + startIndex) % 2 === 0 ? '#FFFFFF' : '#F8F9FB'};">
            <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555555;border-bottom:1px solid #E4E4E4;width:40%;vertical-align:top;">${escHtml(label)}</td>
            <td style="padding:10px 16px;font-size:13px;color:#1A1A2E;border-bottom:1px solid #E4E4E4;vertical-align:top;word-break:break-all;">${escHtml(String(value))}</td>
          </tr>`
      )
      .join('');
  }

  const challengesList = data.operationalChallenges.length > 0
    ? data.operationalChallenges
        .map((c) => `<li style="margin-bottom:4px;">${escHtml(c)}</li>`)
        .join('')
    : '<li style="color:#888;">None selected</li>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>New Assessment Submission</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:40px 20px;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background-color:#FFFFFF;">

  <tr>
    <td style="background-color:#1B2B4D;padding:24px 40px;">
      <p style="margin:0;color:#C9A844;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Efficiency Architects Admin</p>
      <h1 style="margin:8px 0 0;color:#FFFFFF;font-size:18px;font-weight:700;">New Assessment Submission</h1>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 40px 0;">

      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1B2B4D;">Contact Information</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin-bottom:28px;">
        ${renderRows(contactRows)}
      </table>

      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1B2B4D;">Operational Challenges</p>
      <ul style="margin:0 0 28px;padding:0 0 0 20px;font-size:13px;color:#1A1A2E;line-height:1.8;">
        ${challengesList}
      </ul>

      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1B2B4D;">Scope</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin-bottom:28px;">
        ${renderRows(scopeRows)}
      </table>

      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1B2B4D;">Analysis Results</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin-bottom:28px;">
        ${renderRows(analysisRows)}
      </table>

      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1B2B4D;">Pricing Recommendation</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin-bottom:28px;">
        ${renderRows(pricingRows)}
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="padding-right:12px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#1B2B4D;border-radius:2px;">
                  <a href="${escHtml(assessmentUrl)}" target="_blank" style="display:inline-block;padding:10px 20px;color:#FFFFFF;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">View Assessment</a>
                </td>
              </tr>
            </table>
          </td>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#C9A844;border-radius:2px;">
                  <a href="${escHtml(proposalUrl)}" target="_blank" style="display:inline-block;padding:10px 20px;color:#1B2B4D;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">View Proposal</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <tr>
    <td style="background-color:#1B2B4D;padding:16px 40px;text-align:center;">
      <p style="margin:0;font-size:10px;color:#8896AF;letter-spacing:2px;text-transform:uppercase;">Efficiency Architects - Internal Notification</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendAssessmentAdminNotification(
  data: AssessmentNotificationData
): Promise<{ ok: boolean; error?: string }> {
  const to =
    process.env.ADMIN_NOTIFICATION_EMAIL ?? 'freedom@efficiencyarchitects.online';

  const html = buildAssessmentAdminHtml(data);
  return resendEmail(to, `New Assessment: ${data.businessName}`, html);
}

// ---------------------------------------------------------------------------
// E6 - Proposal email sent to the prospect after admin approves
// ---------------------------------------------------------------------------

import type { ProposalWithAssessment } from '@/lib/airtable';

type ChallengeCategory =
  | 'manual_process'
  | 'disconnected_systems'
  | 'visibility_gaps'
  | 'workflow_inconsistency'
  | 'scaling_bottleneck';

const LABEL_TO_CATEGORY: Record<string, ChallengeCategory> = {
  'Manual scheduling and booking':                       'manual_process',
  'No centralized client or customer database':          'manual_process',
  'Inconsistent follow-up with leads or clients':        'workflow_inconsistency',
  'Manual invoicing or billing processes':               'manual_process',
  'Disconnected systems requiring duplicate data entry': 'disconnected_systems',
  'No centralized reporting or performance dashboards':  'visibility_gaps',
  'Leadership lacks real-time operational data':         'visibility_gaps',
  'Manual data entry between multiple tools':            'disconnected_systems',
  'Inconsistent client or customer communication':       'workflow_inconsistency',
  'Manual onboarding or offboarding processes':          'manual_process',
  'Compliance or regulatory reporting done manually':    'visibility_gaps',
  'Vendor or supplier management in spreadsheets':       'workflow_inconsistency',
  'Difficulty scaling operations with team growth':      'scaling_bottleneck',
  'No documented standard operating procedures':         'workflow_inconsistency',
  'Project or task tracking gaps':                       'visibility_gaps',
};

const CATEGORY_FINDINGS: Record<ChallengeCategory, string> = {
  manual_process:
    'A meaningful portion of your team is spending time on repetitive tasks that add no strategic value to the business.',
  disconnected_systems:
    'Your tools are not connected to each other, which means data is being re-entered and reconciled manually across multiple places.',
  visibility_gaps:
    'You do not have a clear, real-time picture of what is happening across your operations, which makes planning and decision-making harder than it needs to be.',
  workflow_inconsistency:
    'Key processes are being handled differently by different people or at different times, which creates unpredictable results for clients and your internal team.',
  scaling_bottleneck:
    'Your operations are struggling to keep up with your team\'s growth, and the challenges you have today will compound as the business scales.',
};

function deriveFindings(challenges: string[]): string[] {
  const counts = new Map<ChallengeCategory, number>();
  for (const label of challenges) {
    const cat = LABEL_TO_CATEGORY[label];
    if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const findings = sorted.slice(0, 3).map(([cat]) => CATEGORY_FINDINGS[cat]);

  if (findings.length === 0) {
    return [
      'Your team is spending time on tasks that could be handled more efficiently.',
      'There are meaningful opportunities to improve visibility and consistency across your operations.',
    ];
  }
  if (findings.length === 1) {
    findings.push(
      'There are additional opportunities to improve consistency and visibility across your operations.'
    );
  }
  return findings;
}

function buildProposalHtml(proposal: ProposalWithAssessment): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL;
  const proposalUrl = `${baseUrl}/proposal/${escHtml(proposal.proposalId)}`;
  const supportEmail =
    process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';
  const year = new Date().getFullYear();

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(n);

  const firstName =
    proposal.contactName.split(' ')[0] || proposal.contactName || 'there';
  const findings = deriveFindings(proposal.operationalChallenges ?? []);

  const findingsHtml = findings
    .map(
      (f) =>
        `<li style="margin-bottom:10px;font-size:14px;color:#1A1A2E;line-height:1.7;">${escHtml(f)}</li>`
    )
    .join('');

  const solutionLabel =
    proposal.projectTypeLabel || proposal.recommendedProjectType || 'Custom Solution';

  const analysisRows: [string, string][] = [
    ['Capacity Score', String(proposal.capacityScore)],
    ['Primary Focus Area', proposal.primaryConstraint],
    ['Solution Category', solutionLabel],
  ];

  const analysisRowsHtml = analysisRows
    .map(
      ([label, value], i) =>
        `<tr style="background-color:${i % 2 === 0 ? '#FFFFFF' : '#F8F9FB'};">
          <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555555;border-bottom:1px solid #E4E4E4;width:45%;vertical-align:top;">${escHtml(label)}</td>
          <td style="padding:10px 16px;font-size:13px;color:#1A1A2E;border-bottom:1px solid #E4E4E4;vertical-align:top;">${escHtml(value)}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Your Capacity Analysis - Efficiency Architects</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:40px 20px;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#FFFFFF;">

  <tr>
    <td style="background-color:#1B2B4D;padding:32px 40px;text-align:center;">
      <p style="margin:0;color:#C9A844;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Efficiency Architects</p>
      <h1 style="margin:10px 0 0;color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:1px;">Your Capacity Analysis</h1>
    </td>
  </tr>

  <tr>
    <td style="padding:40px 40px 0;">
      <p style="margin:0 0 12px;font-size:15px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(firstName)},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#1A1A2E;line-height:1.7;">
        We reviewed the assessment submitted for <strong>${escHtml(proposal.businessName)}</strong>. Here is what we found.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background-color:#F0F2F5;border-left:4px solid #C9A844;padding:20px 24px;">
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#C9A844;">Your Opportunity</p>
            <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#1B2B4D;line-height:1.2;">${escHtml(fmtCurrency(proposal.opportunityLow))} to ${escHtml(fmtCurrency(proposal.opportunityHigh))}</p>
            <p style="margin:0 0 12px;font-size:13px;color:#555555;">in recoverable capacity and growth opportunity per year</p>
            <p style="margin:0;font-size:14px;color:#1A1A2E;font-weight:600;">${proposal.weeklyTimeRecovery} hours per week your team can get back</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px 28px;">
      <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#1B2B4D;">Key Findings</p>
      <ul style="margin:0;padding:0 0 0 20px;">
        ${findingsHtml}
      </ul>
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px 28px;">
      <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#1B2B4D;">Analysis Summary</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;">
        ${analysisRowsHtml}
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px 32px;text-align:center;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#555555;">Recommended Investment</p>
      <p style="margin:0 0 4px;font-size:36px;font-weight:700;color:#1B2B4D;">${escHtml(fmtCurrency(proposal.recommendedFee))}</p>
      <p style="margin:0;font-size:13px;color:#777777;">one-time project investment</p>
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px 40px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:#C9A844;border-radius:2px;">
            <a href="${proposalUrl}" target="_blank" style="display:inline-block;padding:16px 32px;color:#1B2B4D;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Help Me Save Time and Money</a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#888888;">
        Or paste this link into your browser: ${proposalUrl}
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="border-top:1px solid #E4E4E4;font-size:0;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px 32px;">
      <p style="margin:0;font-size:13px;color:#555555;line-height:1.7;">
        Questions? Reply to this email or reach us at <a href="mailto:${escHtml(supportEmail)}" style="color:#1B2B4D;text-decoration:underline;">${escHtml(supportEmail)}</a>.
      </p>
    </td>
  </tr>

  <tr>
    <td style="background-color:#1B2B4D;padding:20px 40px;text-align:center;">
      <p style="margin:0 0 8px;font-size:10px;color:#8896AF;letter-spacing:2px;text-transform:uppercase;">
        Efficiency Architects &copy; ${year}
      </p>
      <p style="margin:0;font-size:11px;color:#8896AF;"><a href="${escHtml(process.env.UNSUBSCRIBE_URL ?? '#')}" style="color:#8896AF;text-decoration:underline;">Unsubscribe</a></p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendProposalEmail(
  proposal: ProposalWithAssessment
): Promise<{ ok: boolean; error?: string }> {
  if (!proposal.email) {
    return { ok: false, error: 'Proposal has no email address.' };
  }

  try {
    const html = buildProposalHtml(proposal);
    const firstName = proposal.contactName.split(' ')[0] || proposal.contactName || 'there';
    const subject = `${firstName}, here is what we found in your business.`;
    return resendEmail(proposal.email, subject, html);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error building proposal email.';
    console.error('sendProposalEmail error:', err);
    return { ok: false, error: msg };
  }
}

function baseEmailShell(params: {
  title: string;
  eyebrow: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const year = new Date().getFullYear();
  const cta = params.ctaLabel && params.ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
        <tr><td style="background-color:#C9A844;border-radius:2px;">
          <a href="${escHtml(params.ctaUrl)}" target="_blank" style="display:inline-block;padding:14px 28px;color:#1B2B4D;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${escHtml(params.ctaLabel)}</a>
        </td></tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escHtml(params.title)}</title></head>
<body style="margin:0;padding:0;background-color:#F8F6F2;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F6F2;padding:36px 18px;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background-color:#FFFFFF;">
<tr><td style="background-color:#1B2B4D;padding:30px 36px;text-align:center;">
  <p style="margin:0;color:#C9A844;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Efficiency Architects</p>
  <h1 style="margin:10px 0 0;color:#FFFFFF;font-size:22px;font-weight:700;">${escHtml(params.title)}</h1>
</td></tr>
<tr><td style="padding:36px;">
  <p style="margin:0 0 18px;color:#C9A844;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${escHtml(params.eyebrow)}</p>
  ${params.bodyHtml}
  ${cta}
</td></tr>
<tr><td style="background-color:#1B2B4D;padding:20px 36px;text-align:center;">
  <p style="margin:0 0 8px;font-size:10px;color:#8896AF;letter-spacing:2px;text-transform:uppercase;">Efficiency Architects &copy; ${year}</p>
  <p style="margin:0;font-size:11px;color:#8896AF;"><a href="${escHtml(process.env.UNSUBSCRIBE_URL ?? '#')}" style="color:#8896AF;text-decoration:underline;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendContentRequestConfirmation(data: {
  email: string;
  clientName: string;
  requestId: string;
  requestType: string;
  title: string;
  portalUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(data.clientName.split(' ')[0] || data.clientName)},</p>
    <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">We received your update request and it is now pending review.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin:22px 0;">
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Request</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">${escHtml(data.requestId)}</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Type</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">${escHtml(data.requestType)}</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Title</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">${escHtml(data.title)}</td></tr>
    </table>
    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">We will review it and keep the status updated inside your portal.</p>`;

  return resendEmail(
    data.email,
    `Your update request was received`,
    baseEmailShell({
      title: 'Update Request Received',
      eyebrow: 'Content Command Center',
      bodyHtml,
      ctaLabel: 'Log In And Explore',
      ctaUrl: data.portalUrl,
    })
  );
}

export async function sendUpdatePublishedEmail(data: {
  email: string;
  clientName: string;
  title: string;
  portalUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(data.clientName.split(' ')[0] || data.clientName)},</p>
    <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">Your update <strong>${escHtml(data.title)}</strong> is now published in Update Hub™.</p>
    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Open your portal to view the live feed.</p>`;

  return resendEmail(
    data.email,
    `Update published: ${data.title}`,
    baseEmailShell({
      title: 'Update Published',
      eyebrow: 'Update Hub™',
      bodyHtml,
      ctaLabel: 'View published updates',
      ctaUrl: data.portalUrl,
    }),
  );
}

export async function sendEnhancementRequestConfirmation(data: {
  email: string;
  clientName: string;
  portalUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(data.clientName.split(' ')[0] || data.clientName)},</p>
    <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">Your enhancement request has been received. We will review it and send you an estimate within 24 hours.</p>`;

  return resendEmail(
    data.email,
    'Your enhancement request was received',
    baseEmailShell({
      title: 'Enhancement Request Received',
      eyebrow: 'Next Step',
      bodyHtml,
      ctaLabel: 'Access My Portal',
      ctaUrl: data.portalUrl,
    })
  );
}

export async function sendAssessmentConfirmationEmail(data: {
  email: string;
  contactName: string;
  capacityScore: number;
  scoreBand: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  projectTypeLabel: string;
  recommendedFee: number;
  proposalId: string;
  /** CTP acquisition track label when classified (Website + Portal, etc.). */
  clientTypeLabel?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL;
  const proposalUrl = `${baseUrl}/proposal/${encodeURIComponent(data.proposalId)}`;
  const supportEmail =
    process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';
  const firstName = data.contactName.split(' ')[0] || data.contactName;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(n);

  const bandLabels: Record<string, string> = {
    healthy: 'Your foundation is solid. There is meaningful room to grow and reclaim time.',
    strained: 'Your business is carrying friction that is quietly costing you time, money, and energy every week.',
    critical: 'Your operations have significant gaps that are actively limiting your growth and personal bandwidth.',
    severe: 'Your business is at a point where the systems underneath it need to change for growth to be sustainable.',
  };
  const scoreInterpretation = bandLabels[data.scoreBand] ?? bandLabels.strained;

  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(firstName)},</p>
    <p style="margin:0 0 22px;font-size:15px;color:#1A1A2E;line-height:1.7;">What you are carrying right now is real. The hours, the manual work, the feeling that the business should be running more smoothly by now. We see it. And we can show you exactly where it is coming from.</p>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Your Capacity Score</p>
    <div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:16px 18px;margin-bottom:22px;">
      <p style="margin:0 0 6px;font-size:28px;font-weight:700;color:#1B2B4D;">${data.capacityScore} / 100</p>
      <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">${escHtml(scoreInterpretation)}</p>
    </div>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">What Friction Is Costing You</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin-bottom:22px;">
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Annual Opportunity</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1B2B4D;">${fmt(data.opportunityLow)} to ${fmt(data.opportunityHigh)} per year</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Time Recovery</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1B2B4D;">${data.weeklyTimeRecovery} hours per week</td></tr>
    </table>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Here Is What Becomes Possible</p>
    <ul style="margin:0 0 22px;padding-left:20px;font-size:14px;color:#1A1A2E;line-height:1.9;">
      <li>More time back in your week, consistently.</li>
      <li>Lower operating costs through smarter systems.</li>
      <li>Clearer visibility into what is actually happening in your business.</li>
      <li>Growth that does not require you to work more hours to sustain it.</li>
    </ul>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Recommended Solution</p>
    <div style="background-color:#F8F6F2;border:1px solid #E4E4E4;padding:16px 18px;margin-bottom:8px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1B2B4D;">${escHtml(data.projectTypeLabel)}</p>
      ${
        data.clientTypeLabel
          ? `<p style="margin:0 0 8px;font-size:13px;color:#555;line-height:1.6;">Primary track: <strong style="color:#1B2B4D;">${escHtml(data.clientTypeLabel)}</strong></p>`
          : ''
      }
      <p style="margin:0;font-size:24px;font-weight:700;color:#1B2B4D;">${fmt(data.recommendedFee)}</p>
    </div>

    <p style="margin:0 0 22px;font-size:13px;color:#777;line-height:1.7;">Your full analysis, including the specific areas we identified and exactly what we recommend, is ready for you now.</p>
    <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">Questions? Reply to this email or reach us at <a href="mailto:${escHtml(supportEmail)}" style="color:#1B2B4D;text-decoration:underline;">${escHtml(supportEmail)}</a>.</p>`;

  return resendEmail(
    data.email,
    `${firstName}, here is what we found in your business.`,
    baseEmailShell({
      title: 'Your Capacity Analysis',
      eyebrow: 'Here Is What We Found',
      bodyHtml,
      ctaLabel: 'See My Full Analysis',
      ctaUrl: proposalUrl,
    })
  );
}

export type CtpExecutiveEmailData = {
  email: string;
  contactName: string;
  businessName: string;
  proposalId: string;
  clientType: import('@/lib/ctp-client-type').CtpClientType;
  capacityScore: number;
  scoreBand: string;
  primaryConstraint: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  projectTypeLabel: string;
  recommendedFee: number;
  recommendations?: string[] | unknown;
  operationalChallenges?: string[];
  /** When portal is already live at send time. */
  portalUrl?: string;
  scheduleUrl?: string;
  digitalPresenceAudit?: import('@/lib/ctp-digital-presence').DigitalPresenceAudit;
};

/** CTP Phase 6 — executive consulting deliverable (not marketing copy). */
export async function sendCtpExecutiveEmail(
  data: CtpExecutiveEmailData,
): Promise<{ ok: boolean; error?: string }> {
  const { buildCtpExecutiveBrief } = await import('@/lib/ctp-executive-brief');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL;
  const proposalUrl = `${baseUrl}/proposal/${encodeURIComponent(data.proposalId)}`;
  const scheduleUrl =
    data.scheduleUrl ||
    process.env.CALENDLY_URL ||
    'https://calendly.com/freedom-efficiencyarchitects/30min';
  const supportEmail =
    process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';
  const firstName = data.contactName.split(' ')[0] || data.contactName;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(n);

  const brief = buildCtpExecutiveBrief({
    businessName: data.businessName,
    contactName: data.contactName,
    clientType: data.clientType,
    capacityScore: data.capacityScore,
    scoreBand: data.scoreBand,
    primaryConstraint: data.primaryConstraint,
    weeklyTimeRecovery: data.weeklyTimeRecovery,
    opportunityLow: data.opportunityLow,
    opportunityHigh: data.opportunityHigh,
    projectTypeLabel: data.projectTypeLabel,
    recommendedFee: data.recommendedFee,
    recommendations: data.recommendations,
    operationalChallenges: data.operationalChallenges,
  });

  const findingsHtml = brief.topFindings
    .map(
      (item) =>
        `<li style="margin:0 0 8px;font-size:14px;color:#1A1A2E;line-height:1.6;">${escHtml(item)}</li>`,
    )
    .join('');
  const scopeHtml = brief.scopeLines
    .map(
      (item) =>
        `<li style="margin:0 0 8px;font-size:14px;color:#1A1A2E;line-height:1.6;">${escHtml(item)}</li>`,
    )
    .join('');

  const portalBlock = data.portalUrl
    ? `<div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:16px 18px;margin-bottom:22px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1B2B4D;">Your Personalized Portal</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">Your workspace is ready: <a href="${escHtml(data.portalUrl)}" style="color:#1B2B4D;font-weight:700;text-decoration:underline;">${escHtml(data.portalUrl)}</a></p>
    </div>`
    : `<div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:16px 18px;margin-bottom:22px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1B2B4D;">Your Personalized Portal</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">We are opening your private workspace now. You will receive portal access as soon as it is live — usually within a few minutes.</p>
    </div>`;

  const primaryCtaUrl = data.portalUrl || proposalUrl;
  const primaryCtaLabel = data.portalUrl ? 'View My Personalized Portal' : 'View My Executive Brief';

  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">Thank you, ${escHtml(firstName)}.</p>
    <p style="margin:0 0 22px;font-size:15px;color:#1A1A2E;line-height:1.7;">We have already begun shaping the ${escHtml(brief.clientTypeLabel)} path for <strong>${escHtml(data.businessName)}</strong>. This is your executive brief — not a marketing follow-up.</p>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Executive Summary</p>
    <p style="margin:0 0 22px;font-size:15px;color:#1A1A2E;line-height:1.7;">${escHtml(brief.executiveSummary)}</p>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Top Findings</p>
    <ul style="margin:0 0 22px;padding-left:20px;">${findingsHtml}</ul>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Capacity &amp; Opportunity</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin-bottom:22px;">
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Capacity Score</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1B2B4D;">${data.capacityScore} / 100</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Annual Opportunity</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1B2B4D;">${fmt(data.opportunityLow)}–${fmt(data.opportunityHigh)}</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Weekly Capacity Loss</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1B2B4D;">${data.weeklyTimeRecovery} hours</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Primary Constraint</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1B2B4D;">${escHtml(data.primaryConstraint)}</td></tr>
    </table>

    ${
      data.digitalPresenceAudit
        ? `<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Digital Presence Score</p>
    <div style="background-color:#F8F6F2;border-left:4px solid #C9A844;padding:16px 18px;margin-bottom:12px;">
      <p style="margin:0 0 6px;font-size:28px;font-weight:700;color:#1B2B4D;">${data.digitalPresenceAudit.overallScore} / 100</p>
      ${
        typeof data.digitalPresenceAudit.scores?.socialPresence === 'number' ||
        typeof data.digitalPresenceAudit.scores?.googleBusinessProfile === 'number'
          ? `<p style="margin:0 0 6px;font-size:13px;color:#1B2B4D;line-height:1.7;">${
              typeof data.digitalPresenceAudit.scores?.socialPresence === 'number'
                ? `Social ${data.digitalPresenceAudit.scores.socialPresence}/100`
                : ''
            }${
              typeof data.digitalPresenceAudit.scores?.socialPresence === 'number' &&
              typeof data.digitalPresenceAudit.scores?.googleBusinessProfile === 'number'
                ? ' · '
                : ''
            }${
              typeof data.digitalPresenceAudit.scores?.googleBusinessProfile === 'number'
                ? `Google Business ${data.digitalPresenceAudit.scores.googleBusinessProfile}/100`
                : ''
            }</p>`
          : ''
      }
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">${escHtml(data.digitalPresenceAudit.impactEstimate)}</p>
    </div>
    <ul style="margin:0 0 22px;padding-left:20px;">
      ${data.digitalPresenceAudit.findings
        .slice(0, 5)
        .map(
          (item) =>
            `<li style="margin:0 0 8px;font-size:14px;color:#1A1A2E;line-height:1.6;"><strong>${escHtml(item.title)}</strong> — ${escHtml(item.detail)}</li>`,
        )
        .join('')}
    </ul>`
        : ''
    }

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Recommended Solution &amp; Scope</p>
    <div style="background-color:#F8F6F2;border:1px solid #E4E4E4;padding:16px 18px;margin-bottom:12px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1B2B4D;">${escHtml(data.projectTypeLabel)}</p>
      <p style="margin:0 0 10px;font-size:13px;color:#555;">Primary track: <strong style="color:#1B2B4D;">${escHtml(brief.clientTypeLabel)}</strong></p>
      <ul style="margin:0;padding-left:18px;">${scopeHtml}</ul>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#1A1A2E;line-height:1.7;">${escHtml(brief.timelineLabel)}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#1A1A2E;line-height:1.7;">${escHtml(brief.investmentLabel)}</p>
    <p style="margin:0 0 22px;font-size:14px;color:#1A1A2E;line-height:1.7;">${escHtml(brief.expectedRoiLabel)}</p>

    ${portalBlock}

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Next Step</p>
    <p style="margin:0 0 12px;font-size:14px;color:#1A1A2E;line-height:1.7;">Review your brief, then book an Executive Strategy Session when you are ready to decide direction with us.</p>
    <p style="margin:0 0 22px;font-size:14px;"><a href="${escHtml(scheduleUrl)}" style="color:#1B2B4D;font-weight:700;text-decoration:underline;">Schedule Executive Strategy Session</a></p>
    <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">Questions? Reply to this email or reach us at <a href="mailto:${escHtml(supportEmail)}" style="color:#1B2B4D;text-decoration:underline;">${escHtml(supportEmail)}</a>.</p>`;

  return resendEmail(
    data.email,
    `${firstName}, your executive brief for ${data.businessName} is ready.`,
    baseEmailShell({
      title: 'Executive Brief',
      eyebrow: 'Consider The Possibilities™',
      bodyHtml,
      ctaLabel: primaryCtaLabel,
      ctaUrl: primaryCtaUrl,
    }),
  );
}

export async function sendInternalNotification(data: {
  subject: string;
  title: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL ?? 'freedom@efficiencyarchitects.online';
  const bodyHtml = `<p style="margin:0;font-size:15px;color:#1A1A2E;line-height:1.7;white-space:pre-wrap;">${escHtml(data.body)}</p>`;
  return resendEmail(to, data.subject, baseEmailShell({ title: data.title, eyebrow: 'Internal Notice', bodyHtml }));
}

export async function sendConnectWelcomeEmail(data: {
  email: string;
  name: string;
  organizationName: string;
  resourceTitle: string;
  guideUrl: string;
  journeyUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const firstName = data.name.split(' ')[0] || data.name;
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(firstName)},</p>
    <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">Thanks for connecting with ${escHtml(data.organizationName)}. Here is the resource we promised after your conversation.</p>
    <div style="background:#101820;color:#fff;border-left:5px solid #D91F2A;padding:20px;margin:22px 0;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ff4b4b;">Instant Resource</p>
      <p style="margin:0;font-size:22px;font-weight:700;">${escHtml(data.resourceTitle)}</p>
      <p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:rgba(255,255,255,.76);">Your next step is ready. Save the resource, then open the journey page when you are ready to take action.</p>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">We will use this connection to send useful next steps, not noise. If this was not for you, you can ignore this email.</p>
    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Ready for the next step? <a href="${escHtml(data.journeyUrl)}" style="color:#101820;font-weight:700;">Open Your Journey Starts Here</a>.</p>`;

  return resendEmail(
    data.email,
    `Welcome to ${data.organizationName} - ${data.resourceTitle}`,
    baseEmailShell({
      title: `Welcome To ${data.organizationName}`,
      eyebrow: 'Connect',
      bodyHtml,
      ctaLabel: 'View Guide',
      ctaUrl: data.guideUrl,
    }),
  );
}

export async function sendConnectKitEmail(data: {
  email: string;
  organizationName: string;
  kit: import('@/lib/connect-kit').ConnectKit;
}): Promise<{ ok: boolean; error?: string }> {
  const primary = data.kit.links[0];
  const qrUrl = primary ? `${data.kit.baseUrl}${primary.qrPath}` : `${data.kit.baseUrl}/api/connect/qr?url=${encodeURIComponent(data.kit.captureUrl)}&label=${encodeURIComponent(data.organizationName)}`;
  const linkRows = data.kit.links
    .map(
      (link) =>
        `<li style="margin:0 0 10px;font-size:14px;line-height:1.6;"><strong>${escHtml(link.label)}</strong><br/><a href="${escHtml(link.url)}" style="color:#1B2B4D;">${escHtml(link.url)}</a></li>`,
    )
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">Your Connect kit is ready for ${escHtml(data.organizationName)}.</p>
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">Open your kit page anytime to download QR codes and copy links for events, staff, and campaigns.</p>
    <ul style="margin:0 0 18px;padding-left:18px;">${linkRows}</ul>
    <p style="margin:0 0 12px;font-size:14px;color:#555;line-height:1.7;">Default QR (open or print): <a href="${escHtml(qrUrl)}" style="color:#1B2B4D;font-weight:700;">Download QR</a></p>
    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Kit page: <a href="${escHtml(data.kit.kitPageUrl)}" style="color:#1B2B4D;font-weight:700;">${escHtml(data.kit.kitPageUrl)}</a></p>`;

  return resendEmail(
    data.email,
    `Your ${data.organizationName} Connect kit is ready`,
    baseEmailShell({
      title: 'Connect Kit Ready',
      eyebrow: 'EA Connect',
      bodyHtml,
      ctaLabel: 'Open Connect Kit',
      ctaUrl: data.kit.kitPageUrl,
    }),
  );
}

export async function sendConnectSequenceEmail(data: {
  email: string;
  name: string;
  organizationName: string;
  stepTitle: string;
  resourceTitle: string;
  resourceUrl: string;
  journeyUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const firstName = data.name.split(' ')[0] || data.name;
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(firstName)},</p>
    <p style="margin:0 0 18px;font-size:15px;color:#1A1A2E;line-height:1.7;">${escHtml(data.stepTitle)} from ${escHtml(data.organizationName)}.</p>
    <div style="background:#101820;color:#fff;border-left:5px solid #D91F2A;padding:20px;margin:22px 0;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ff4b4b;">Your next resource</p>
      <p style="margin:0;font-size:22px;font-weight:700;">${escHtml(data.resourceTitle)}</p>
    </div>
    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Continue your journey anytime: <a href="${escHtml(data.journeyUrl)}" style="color:#101820;font-weight:700;">Open journey page</a>.</p>`;

  return resendEmail(
    data.email,
    `${data.organizationName} — ${data.resourceTitle}`,
    baseEmailShell({
      title: data.stepTitle,
      eyebrow: 'Connect Follow-up',
      bodyHtml,
      ctaLabel: `Open ${data.resourceTitle}`,
      ctaUrl: data.resourceUrl,
    }),
  );
}

export async function sendConnectSms(data: {
  phone: string;
  organizationName: string;
  resourceTitle: string;
  journeyUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: 'Twilio not configured.' };
  }

  const body = `Thanks for connecting with ${data.organizationName}. Your ${data.resourceTitle} is ready: ${data.journeyUrl}`;
  const params = new URLSearchParams({
    To: data.phone,
    From: from,
    Body: body,
  });

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return { ok: false, error: `Twilio send failed (${response.status}). ${detail}`.trim() };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown Twilio error.' };
  }
}

export async function sendRevealEmail(data: {
  email: string;
  firstName: string;
  projectType: string;
  deliverables: string[];
  weeklyTimeRecovery: number;
  annualCapacityUnlocked: number;
  systemsAutomated: number;
  revealUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const deliverables = data.deliverables
    .map((item) => `<li style="margin-bottom:8px;">${escHtml(item)}</li>`)
    .join('');
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">${escHtml(data.firstName)}, your system is live. This is the moment all the planning has been leading to.</p>
    <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1B2B4D;">Here is what we built for you.</p>
    <ul style="margin:0 0 22px;padding-left:20px;font-size:14px;color:#1A1A2E;line-height:1.7;">${deliverables}</ul>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;">
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Project Type</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">${escHtml(data.projectType)}</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Weekly Time Recovered</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">${data.weeklyTimeRecovery} hours</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Annual Capacity Unlocked</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">${fmt(data.annualCapacityUnlocked)}</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#555;">Systems Automated</td><td style="padding:12px 16px;font-size:14px;color:#1A1A2E;">${data.systemsAutomated}</td></tr>
    </table>`;

  return resendEmail(
    data.email,
    `${data.firstName}, your system is live. Welcome to the other side.`,
    baseEmailShell({
      title: 'Your System Is Live',
      eyebrow: 'Welcome To The Other Side',
      bodyHtml,
      ctaLabel: 'See Your New System',
      ctaUrl: data.revealUrl,
    })
  );
}

export async function sendCaptureReadyEmail(data: {
  email: string;
  title: string;
  magnifiUrl: string;
  considerUrl?: string;
  guidanceUrl?: string;
  workspaceUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const linkRows = [
    ['Magnifi story', data.magnifiUrl],
    data.considerUrl ? ['CTP share link', data.considerUrl] : undefined,
    data.workspaceUrl ? ['Workspace / portal', data.workspaceUrl] : undefined,
    data.guidanceUrl ? ['Simplifi guidance', data.guidanceUrl] : undefined,
  ]
    .filter((row): row is [string, string] => Boolean(row))
    .map(
      ([label, url]) =>
        `<tr>
          <td style="padding:12px 14px;border-bottom:1px solid #E4E4E4;font-size:12px;font-weight:700;color:#555;vertical-align:top;">${escHtml(label)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #E4E4E4;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${escHtml(url)}" target="_blank" style="color:#1B2B4D;text-decoration:underline;">${escHtml(url)}</a></td>
        </tr>`
    )
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">Your capture is ready. Simplifi analyzed it, Magnifi built the story, and Amplifi can share the link.</p>
    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1B2B4D;">${escHtml(data.title)}</p>
    <p style="margin:0 0 18px;font-size:13px;color:#555;line-height:1.7;">Open Magnifi for the cinematic experience, share the CTP link, or continue the work from the workspace.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E4;margin:18px 0;">
      ${linkRows}
    </table>`;

  return resendEmail(
    data.email,
    `Your Magnifi story is ready — ${data.title}`,
    baseEmailShell({
      title: 'Capture Complete',
      eyebrow: 'Simplifi → Magnifi → Amplifi',
      bodyHtml,
      ctaLabel: data.considerUrl ? 'Open CTP Link' : 'Open Magnifi',
      ctaUrl: data.considerUrl ?? data.magnifiUrl,
    })
  );
}
