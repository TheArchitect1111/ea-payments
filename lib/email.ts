const AIRTABLE_BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';

export interface WelcomeEmailData {
  clientName: string;
  email: string;
  packageName: string;
  portalLoginUrl: string;
  tempCredentials?: string;
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
}): string {
  const { clientName, packageName, portalLoginUrl, supportEmail, tempCredentials, nextSteps, year } =
    params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Welcome to Efficiency Architects</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:40px 20px;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#FFFFFF;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#1B2B4D;padding:32px 40px;text-align:center;">
      <p style="margin:0;color:#C9A844;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Efficiency Architects</p>
      <h1 style="margin:10px 0 0;color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:1px;">Welcome to EA</h1>
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
        Efficiency Architects &copy; ${year}
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
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `Resend API error (${res.status}): ${detail}` };
    }

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

  const tempCredentials =
    data.tempCredentials ??
    'Our team will send your portal access details in a separate email once your account is provisioned.';

  const nextSteps = nextStepsForPackage(data.packageName);
  const year = new Date().getFullYear();

  const html = buildWelcomeHtml({
    clientName: data.clientName,
    packageName: data.packageName,
    portalLoginUrl: data.portalLoginUrl,
    supportEmail,
    tempCredentials,
    nextSteps,
    year,
  });

  return resendEmail(data.email, 'Welcome to Efficiency Architects', html);
}

export async function sendAdminNotification(
  data: AdminNotificationData
): Promise<{ ok: boolean; error?: string }> {
  const to =
    process.env.ADMIN_NOTIFICATION_EMAIL ?? 'freedom@efficiencyarchitects.online';

  const html = buildAdminHtml(data);
  return resendEmail(to, 'New Client Payment Received', html);
}
