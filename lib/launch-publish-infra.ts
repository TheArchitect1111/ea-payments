/**
 * Launch infrastructure diagnostics for Website + Portal publish path.
 * Missing configuration fails with clear messages — no silent skip.
 */
export type LaunchInfraCheck = {
  id: string;
  ok: boolean;
  required: boolean;
  detail: string;
};

function present(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && String(v).trim());
}

export function diagnoseWebsitePortalLaunchInfra(): {
  ok: boolean;
  checks: LaunchInfraCheck[];
  blockers: string[];
} {
  const checks: LaunchInfraCheck[] = [
    {
      id: 'airtable',
      required: true,
      ok: present('AIRTABLE_API_KEY') || present('AIRTABLE_PAT'),
      detail: 'AIRTABLE_API_KEY or AIRTABLE_PAT required for clients, orgs, and Creative Studio',
    },
    {
      id: 'stripe_secret',
      required: true,
      ok: present('STRIPE_SECRET_KEY'),
      detail: 'STRIPE_SECRET_KEY required for checkout',
    },
    {
      id: 'stripe_webhook',
      required: true,
      ok: present('STRIPE_WEBHOOK_SECRET'),
      detail: 'STRIPE_WEBHOOK_SECRET required to verify webhook signatures',
    },
    {
      id: 'stripe_price_website_portal',
      required: true,
      ok: present('STRIPE_PRICE_WEBSITE_PORTAL_STARTER'),
      detail: 'STRIPE_PRICE_WEBSITE_PORTAL_STARTER required for Website + Portal Starter',
    },
    {
      id: 'stripe_publishable',
      required: true,
      ok: present('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
      detail: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY required for client checkout',
    },
    {
      id: 'resend',
      required: true,
      ok: present('RESEND_API_KEY'),
      detail: 'RESEND_API_KEY required for welcome / magic-link email delivery',
    },
    {
      id: 'admin_session_secret',
      required: true,
      ok: present('ADMIN_SESSION_SECRET'),
      detail: 'ADMIN_SESSION_SECRET required for magic-link HMAC tokens',
    },
    {
      id: 'session_secret',
      required: true,
      ok: present('SESSION_SECRET'),
      detail: 'SESSION_SECRET required for portal sessions',
    },
    {
      id: 'base_url',
      required: false,
      ok: present('NEXT_PUBLIC_BASE_URL') || present('NEXT_PUBLIC_SITE_URL'),
      detail: 'NEXT_PUBLIC_BASE_URL (or SITE_URL) recommended for email link origins',
    },
  ];

  const blockers = checks
    .filter((c) => c.required && !c.ok)
    .map((c) => `${c.id}: ${c.detail}`);

  return { ok: blockers.length === 0, checks, blockers };
}
