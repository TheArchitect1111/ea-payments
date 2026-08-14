import type { PlatformRole } from '@/lib/rbac';
import type { AmandaPortalAudience } from '@/lib/amanda-catherine/config';
import { listAmandaPayments } from '@/lib/amanda-catherine/payment-fulfillment';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';

const FORM_AUDIENCES = new Set<AmandaPortalAudience>([
  'client',
  'student-trainee',
  'certified-practitioner',
  'member-community-participant',
  'media-guest',
  'volunteer',
  'vendor-partner',
]);

const AMANDA_OWNER_EMAILS = new Set([
  'amanda@aesthetikine.com',
]);

export async function resolveAmandaAudience(input: {
  portalSlug: string;
  email: string;
  role?: PlatformRole;
}): Promise<AmandaPortalAudience> {
  const email = input.email.trim().toLowerCase();
  if (AMANDA_OWNER_EMAILS.has(email)) return 'admin';
  if (input.role === 'owner' || input.role === 'admin') return 'admin';
  if (input.role === 'staff' || input.role === 'manager') return 'staff';

  const [submissions, payments] = await Promise.all([
    listPortalFormSubmissions(input.portalSlug, { email }),
    listAmandaPayments(input.portalSlug, email),
  ]);

  for (const submission of submissions) {
    const audience = String(submission.payload?.audience || '') as AmandaPortalAudience;
    if (FORM_AUDIENCES.has(audience)) return audience;
  }

  const latestPayment = payments[0];
  if (latestPayment?.membershipId) return 'member-community-participant';
  if (latestPayment?.offerId === 'lifeline-artist-business-launch') return 'media-guest';
  if (latestPayment?.offerId?.includes('training') || latestPayment?.offerId?.includes('certification')) {
    return 'student-trainee';
  }
  return 'client';
}
