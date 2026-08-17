import crypto from 'node:crypto';
import {
  createOrUpdateClientRecord,
  getClientByEmail,
  setPortalCredentials,
} from '@/lib/airtable';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { createMembership, findMembership } from '@/lib/memberships';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { canonicalPlatformOrigin } from '@/lib/platform-urls';
import type { AmandaPortalAudience } from './config';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

const AMANDA_PORTAL_SLUG = 'amanda-catherine';

type AmandaAccessProfile = {
  portalSlug: string;
  email: string;
  name: string;
  audience: AmandaPortalAudience;
  courseIds: string[];
  updatedAt: string;
};

function accessProfileId(portalSlug: string, email: string) {
  return `amanda-access-${crypto.createHash('sha256').update(`${portalSlug}:${email.toLowerCase()}`).digest('hex').slice(0, 24)}`;
}

export async function getAmandaAssignedAudience(portalSlug: string, email: string) {
  const profile = await loadStudioRecord<AmandaAccessProfile>('experience', accessProfileId(portalSlug, email));
  return profile?.audience || null;
}

export async function getAmandaAssignedCourseIds(portalSlug: string, email: string) {
  const profile = await loadStudioRecord<AmandaAccessProfile>('experience', accessProfileId(portalSlug, email));
  return Array.isArray(profile?.courseIds) ? profile.courseIds : [];
}

function temporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function displayName(name: string, email: string) {
  const trimmed = name.trim();
  if (trimmed) return trimmed;
  return email.split('@')[0]?.replace(/[._-]+/g, ' ') || 'Amanda Catherine client';
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function sendAmandaWelcome(input: {
  email: string;
  name: string;
  tempPassword: string;
  audience: AmandaPortalAudience;
}) {
  const loginUrl = `${canonicalPlatformOrigin()}/portal/login?next=%2Fportal%2F${AMANDA_PORTAL_SLUG}%2Flearning`;
  const firstName = input.name.split(/\s+/)[0] || 'there';
  const safeFirstName = escapeHtml(firstName);
  const safeEmail = escapeHtml(input.email);
  const safePassword = escapeHtml(input.tempPassword);
  return sendAuthEmail({
    to: input.email,
    subject: 'Your Amanda Catherine private portal is ready',
    title: 'Welcome to your Amanda Catherine portal',
    bodyHtml: `
      <p>Hi ${safeFirstName},</p>
      <p>Your private Amanda Catherine portal is ready. This is where you will receive the recordings, files, program materials, and next steps assigned specifically to you.</p>
      <div style="padding:18px;background:#f7f1e8;border-left:4px solid #b9894d;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0;"><strong>Temporary password:</strong> ${safePassword}</p>
      </div>
      <p><a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#23334d;color:#fff;text-decoration:none;border-radius:8px;">Open my private portal</a></p>
      <p>For your protection, change the temporary password after your first sign-in. Only content assigned to your email address will appear in your portal.</p>
    `,
    text: `Your Amanda Catherine portal is ready. Sign in at ${loginUrl} with ${input.email} and temporary password ${input.tempPassword}.`,
    brandLabel: 'Amanda Catherine · AesthetiKine',
    brandColor: '#23334d',
  });
}

export async function provisionAmandaClientAccess(input: {
  email: string;
  name?: string;
  audience: AmandaPortalAudience;
  amountPaidCad?: number;
  transactionId?: string;
  courseIds?: string[];
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) return { ok: false as const, error: 'A valid client email is required.' };
  const name = displayName(input.name || '', email);
  let record = await getClientByEmail(email);

  if (record?.portalSlug && record.portalSlug !== AMANDA_PORTAL_SLUG) {
    return { ok: false as const, error: 'This email already belongs to a different portal.' };
  }

  let created = false;
  if (!record) {
    const result = await createOrUpdateClientRecord({
      clientName: name,
      organization: 'Amanda Catherine',
      email,
      packagePurchased: 'Implementation Package',
      amountPaid: input.amountPaidCad || 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      stripeTransactionId: input.transactionId || `amanda-access-${crypto.randomUUID()}`,
      portalAccessStatus: 'Active',
      onboardingStatus: 'In Progress',
    });
    if (!result.ok || !result.recordId) {
      return { ok: false as const, error: result.error || 'Client access record could not be created.' };
    }
    record = await getClientByEmail(email);
    if (!record) return { ok: false as const, error: 'Client access record could not be verified.' };
    created = true;
  }

  let tempPassword = record.tempPassword || '';
  const needsCredentials = !record.portalSlug || (!record.passwordChanged && !record.tempPassword);
  if (needsCredentials) {
    tempPassword = temporaryPassword();
    const credentials = await setPortalCredentials(record.id, AMANDA_PORTAL_SLUG, tempPassword, email);
    if (!credentials.ok) return { ok: false as const, error: credentials.error || 'Portal credentials could not be created.' };
    created = true;
  }

  const { orgId } = await ensureOrganizationForPortal({
    portalSlug: AMANDA_PORTAL_SLUG,
    name: 'Amanda Catherine',
    organizationName: 'Amanda Catherine',
  });
  if (!orgId.startsWith('org_') && !(await findMembership(email, orgId))) {
    await createMembership({ userEmail: email, organizationId: orgId, role: 'guest' });
  }
  const existingProfile = await loadStudioRecord<AmandaAccessProfile>('experience', accessProfileId(AMANDA_PORTAL_SLUG, email));
  const courseIds = [...new Set([...(existingProfile?.courseIds || []), ...(input.courseIds || [])])];
  await saveStudioRecord({
    recordType: 'experience',
    id: accessProfileId(AMANDA_PORTAL_SLUG, email),
    organizationId: syntheticOrgId(AMANDA_PORTAL_SLUG),
    title: `Amanda client access: ${email}`,
    payload: {
      portalSlug: AMANDA_PORTAL_SLUG,
      email,
      name,
      audience: input.audience,
      courseIds,
      updatedAt: new Date().toISOString(),
    } satisfies AmandaAccessProfile,
  });

  let welcomeSent = false;
  if (created && tempPassword) {
    const welcome = await sendAmandaWelcome({ email, name, tempPassword, audience: input.audience });
    welcomeSent = welcome.ok;
    if (!welcome.ok) {
      return { ok: false as const, error: welcome.error || 'Access was created, but the welcome email could not be sent.', accessCreated: true };
    }
  }

  return {
    ok: true as const,
    created,
    welcomeSent,
    email,
    loginUrl: `${canonicalPlatformOrigin()}/portal/login?next=%2Fportal%2F${AMANDA_PORTAL_SLUG}%2Flearning`,
  };
}
