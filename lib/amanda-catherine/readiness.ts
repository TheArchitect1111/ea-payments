import { AMANDA_MEMBERSHIPS } from '@/lib/amanda-catherine/config';
import { findOrganizationByPortalSlug } from '@/lib/organizations';

export type AmandaReadinessCheck = {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
};

export async function getAmandaLaunchReadiness(portalSlug: string) {
  const cleanSlug = portalSlug.trim().toLowerCase();
  const org = cleanSlug ? await findOrganizationByPortalSlug(cleanSlug) : null;

  const membershipChecks: AmandaReadinessCheck[] = AMANDA_MEMBERSHIPS.map((membership) => ({
    id: `membership:${membership.id}`,
    label: `${membership.name} Stripe price`,
    ready: Boolean(process.env[membership.stripePriceEnvKey]?.trim()),
    detail: process.env[membership.stripePriceEnvKey]?.trim()
      ? 'Recurring Stripe Price ID configured.'
      : `Missing ${membership.stripePriceEnvKey}.`,
  }));

  const checks: AmandaReadinessCheck[] = [
    {
      id: 'stripe-secret',
      label: 'Stripe payments',
      ready: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
      detail: process.env.STRIPE_SECRET_KEY?.trim()
        ? 'Stripe server credentials configured.'
        : 'Missing STRIPE_SECRET_KEY.',
    },
    {
      id: 'stripe-webhook',
      label: 'Amanda Stripe fulfillment webhook',
      ready: Boolean(process.env.STRIPE_AMANDA_WEBHOOK_SECRET?.trim() || process.env.STRIPE_WEBHOOK_SECRET?.trim()),
      detail: process.env.STRIPE_AMANDA_WEBHOOK_SECRET?.trim() || process.env.STRIPE_WEBHOOK_SECRET?.trim()
        ? 'Webhook signing secret configured.'
        : 'Missing Stripe webhook signing secret.',
    },
    ...membershipChecks,
    {
      id: 'jane-booking',
      label: 'Jane booking handoff',
      ready: Boolean(process.env.AMANDA_JANE_BOOKING_URL?.trim()),
      detail: process.env.AMANDA_JANE_BOOKING_URL?.trim()
        ? 'Amanda Jane booking URL configured.'
        : 'Missing AMANDA_JANE_BOOKING_URL.',
    },
    {
      id: 'financing',
      label: 'Financing handoff',
      ready: Boolean(process.env.AMANDA_FINANCING_URL?.trim()),
      detail: process.env.AMANDA_FINANCING_URL?.trim()
        ? 'Amanda financing URL configured.'
        : 'Missing AMANDA_FINANCING_URL.',
    },
    {
      id: 'nylas-api',
      label: 'Nylas calendar service',
      ready: Boolean(process.env.NYLAS_API_KEY?.trim()),
      detail: process.env.NYLAS_API_KEY?.trim()
        ? 'Nylas API credential configured.'
        : 'Missing NYLAS_API_KEY.',
    },
    {
      id: 'nylas-grant',
      label: 'Amanda calendar account connection',
      ready: Boolean(org?.nylasGrantId && org?.nylasCalendarId),
      detail: org?.nylasGrantId && org?.nylasCalendarId
        ? 'Amanda calendar grant and calendar ID are connected.'
        : 'Amanda organization still needs a connected Google or Outlook calendar.',
    },
  ];

  const readyCount = checks.filter((check) => check.ready).length;
  const total = checks.length;
  const score = total ? Math.round((readyCount / total) * 100) : 0;

  return {
    portalSlug: cleanSlug,
    ready: readyCount === total,
    score,
    readyCount,
    total,
    checks,
  };
}
