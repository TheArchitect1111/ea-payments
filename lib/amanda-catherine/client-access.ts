import { amandaCourseReady } from './lms-policy';
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
import { invitedAmandaLearner } from './invited-learners';
import { z } from 'zod';
import { listStudioRecords } from '@/lib/creative-studio/persistence';
import { amandaTrialExpired, resolveAmandaEntitlement, type AmandaCourseEntitlement } from './test-access-rules';

const AMANDA_PORTAL_SLUG = 'amanda-catherine';

const AmandaAccessProfileSchema = z.object({
  portalSlug: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  audience: z.enum([
    'client',
    'student-trainee',
    'certified-practitioner',
    'member-community-participant',
    'media-guest',
    'volunteer',
    'vendor-partner',
    'staff',
    'admin',
  ]),
  courseIds: z.array(z.string().min(1)),
  // Older grants without entitlement metadata retain their original access.
  entitlements: z.record(z.string(), z.object({
    isTestAccess: z.boolean(),
    testPaidAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    stripeSessionId: z.string().optional(),
    status: z.enum(['active','expired']).optional(),
  })).optional(),
  updatedAt: z.string().min(1),
});

type AmandaAccessProfile = z.infer<typeof AmandaAccessProfileSchema>;
type AmandaEntitlement = AmandaCourseEntitlement;

function accessProfileId(portalSlug: string, email: string) {
  return `amanda-access-${crypto.createHash('sha256').update(`${portalSlug}:${email.toLowerCase()}`).digest('hex').slice(0, 24)}`;
}

export async function getAmandaAssignedAudience(portalSlug: string, email: string) {
  const stored = await loadStudioRecord<unknown>('experience', accessProfileId(portalSlug, email));
  const profile = AmandaAccessProfileSchema.safeParse(stored);
  return (profile.success ? profile.data.audience : null) || invitedAmandaLearner(email)?.audience || null;
}

export async function getAmandaAssignedCourseIds(portalSlug: string, email: string) {
  const stored = await loadStudioRecord<unknown>('experience', accessProfileId(portalSlug, email));
  const profile = AmandaAccessProfileSchema.safeParse(stored);
  return (profile.success ? profile.data.courseIds : [...(invitedAmandaLearner(email)?.courseIds || [])])
    .filter((id) => amandaCourseReady(id) && (!profile.success || !amandaTrialExpired(profile.data.entitlements?.[id])));
}

/** Entitlement reads never write records and never restore expired test grants. */
export async function getAmandaCourseAccessDecision(portalSlug: string, email: string, courseId: string) {
  const stored = await loadStudioRecord<unknown>('experience', accessProfileId(portalSlug, email));
  const parsed = AmandaAccessProfileSchema.safeParse(stored);
  const profile = parsed.success ? parsed.data : null;
  const grant = profile?.entitlements?.[courseId];
  if (amandaTrialExpired(grant)) {
    return { authorized: false as const, reason: 'TRIAL_EXPIRED' as const, expiresAt: grant.expiresAt, redirect: `/portal/amanda-catherine/expired?courseId=${encodeURIComponent(courseId)}` };
  }
  const assigned = profile ? profile.courseIds.includes(courseId) : Boolean(invitedAmandaLearner(email)?.courseIds?.includes(courseId));
  return { authorized: assigned && amandaCourseReady(courseId), reason: assigned ? undefined : 'NOT_ASSIGNED', expiresAt: grant?.expiresAt ?? null };
}

/** Paid or explicitly invited learners may open Amanda's training surface even
 * while tenant-wide module entitlements are still being synchronized. */
export async function hasAmandaLearningAccess(portalSlug: string, email: string) {
  if (!portalSlug.toLowerCase().startsWith(AMANDA_PORTAL_SLUG) || !email.trim()) return false;
  return (await getAmandaAssignedCourseIds(portalSlug, email)).length > 0;
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
  tempPassword?: string;
  audience: AmandaPortalAudience;
}) {
  const loginUrl = `${canonicalPlatformOrigin()}/portal/login?next=%2Fportal%2F${AMANDA_PORTAL_SLUG}%2Flearning`;
  const firstName = input.name.split(/\s+/)[0] || 'there';
  const safeFirstName = escapeHtml(firstName);
  const safeEmail = escapeHtml(input.email);
  const safePassword = input.tempPassword ? escapeHtml(input.tempPassword) : '';
  const credentialHtml = input.tempPassword
    ? `<div style="padding:18px;background:#f7f1e8;border-left:4px solid #b9894d;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0;"><strong>Temporary password:</strong> ${safePassword}</p>
      </div>`
    : `<div style="padding:18px;background:#f7f1e8;border-left:4px solid #b9894d;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0;">Use the secure email code sent when you sign in. Your existing portal account remains unchanged.</p>
      </div>`;
  const text = input.tempPassword
    ? `Your Amanda Catherine portal is ready. Sign in at ${loginUrl} with ${input.email} and temporary password ${input.tempPassword}.`
    : `Your Amanda Catherine course access is ready. Sign in at ${loginUrl} with ${input.email} and use the secure code sent to your email.`;

  return sendAuthEmail({
    to: input.email,
    subject: 'Your Amanda Catherine private portal is ready',
    title: 'Welcome to your Amanda Catherine portal',
    bodyHtml: `
      <p>Hi ${safeFirstName},</p>
      <p>Your private Amanda Catherine portal is ready. This is where you will receive the recordings, files, program materials, and next steps assigned specifically to you.</p>
      ${credentialHtml}
      <p><a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#23334d;color:#fff;text-decoration:none;border-radius:8px;">Open my private portal</a></p>
      <p>Only content assigned to your email address will appear in your portal.</p>
    `,
    text,
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
  isTestAccess?: boolean;
  testPaidAt?: string | null;
  expiresAt?: string | null;
  stripeSessionId?: string;
}) {
  if ((input.courseIds || []).some((id) => !amandaCourseReady(id))) return { ok: false as const, error: 'This course is waitlist only.' };
  if (input.isTestAccess && (!input.testPaidAt || !input.expiresAt || !input.stripeSessionId)) return { ok: false as const, error: 'Verified test payment dates and Stripe session ID are required.' };
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) return { ok: false as const, error: 'A valid client email is required.' };
  const name = displayName(input.name || '', email);
  let record = await getClientByEmail(email);
  const belongsToAnotherPortal = Boolean(record?.portalSlug && record.portalSlug !== AMANDA_PORTAL_SLUG);

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
  const needsCredentials = !belongsToAnotherPortal && (!record.portalSlug || (!record.passwordChanged && !record.tempPassword));
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

  const existingStoredProfile = await loadStudioRecord<unknown>('experience', accessProfileId(AMANDA_PORTAL_SLUG, email));
  const existingProfileResult = AmandaAccessProfileSchema.safeParse(existingStoredProfile);
  const existingProfile = existingProfileResult.success ? existingProfileResult.data : null;
  const priorCourseIds = existingProfile?.courseIds || [];
  const courseIds = [...new Set([...priorCourseIds, ...(input.courseIds || [])])].filter(amandaCourseReady);
  const entitlements: Record<string, AmandaEntitlement> = { ...(existingProfile?.entitlements || {}) };
  for (const id of input.courseIds || []) {
    const prior = entitlements[id];
    const purchase: AmandaEntitlement = input.isTestAccess
      ? { isTestAccess: true, testPaidAt: input.testPaidAt!, expiresAt: input.expiresAt!, stripeSessionId: input.stripeSessionId, status: 'active' }
      : { isTestAccess: false, testPaidAt: null, expiresAt: null, stripeSessionId: input.stripeSessionId, status: 'active' };
    const resolved = resolveAmandaEntitlement(prior, purchase, Boolean(input.isTestAccess && priorCourseIds.includes(id) && !prior));
    if (resolved) entitlements[id] = resolved;
  }
  const accessChanged = !existingProfile || courseIds.some((courseId) => !priorCourseIds.includes(courseId))
    || JSON.stringify(entitlements) !== JSON.stringify(existingProfile?.entitlements || {});
  const profileSave = await saveStudioRecord({
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
      entitlements,
      updatedAt: new Date().toISOString(),
    } satisfies AmandaAccessProfile,
  });
  if (!profileSave.ok || (process.env.VERCEL_ENV === 'production' && !profileSave.persistedToAirtable)) {
    return { ok: false as const, error: profileSave.error || 'Course assignment could not be saved.' };
  }

  let welcomeSent = false;
  if ((created || accessChanged) && (tempPassword || belongsToAnotherPortal)) {
    const welcome = await sendAmandaWelcome({
      email,
      name,
      tempPassword: belongsToAnotherPortal ? undefined : tempPassword,
      audience: input.audience,
    });
    welcomeSent = welcome.ok;
    if (!welcome.ok) {
      return { ok: false as const, error: welcome.error || 'Access was created, but the welcome email could not be sent.', accessCreated: true };
    }
  }

  return {
    ok: true as const,
    created: created || accessChanged,
    welcomeSent,
    email,
    loginUrl: `${canonicalPlatformOrigin()}/portal/login?next=%2Fportal%2F${AMANDA_PORTAL_SLUG}%2Flearning`,
  };
}

/** Hourly, idempotent maintenance. Authorization always enforces the expiry timestamp,
 * so a delayed cron can never extend access. */
export async function expireAmandaTestEntitlements(now = new Date()) {
  const portalSlug = AMANDA_PORTAL_SLUG;
  const orgId = syntheticOrgId(portalSlug);
  const records = await listStudioRecords<unknown>('experience', orgId);
  let scanned = 0;
  let expired = 0;
  const errors: string[] = [];
  for (const row of records) {
    const parsed = AmandaAccessProfileSchema.safeParse(row);
    if (!parsed.success || parsed.data.portalSlug !== portalSlug) continue;
    scanned += 1;
    const email = parsed.data.email;
    // Re-load before write so a recent full-price upgrade is never clobbered.
    const fresh = AmandaAccessProfileSchema.safeParse(
      await loadStudioRecord<unknown>('experience', accessProfileId(portalSlug, email)),
    );
    if (!fresh.success) continue;
    const entitlements = { ...(fresh.data.entitlements ?? {}) };
    let changed = false;
    for (const [courseId, grant] of Object.entries(entitlements)) {
      if (grant.isTestAccess && grant.status !== 'expired' &&
          amandaTrialExpired(grant, now.getTime())) {
        entitlements[courseId] = { ...grant, status: 'expired' };
        changed = true;
        expired += 1;
      }
    }
    if (!changed) continue;
    const saved = await saveStudioRecord({
      recordType: 'experience',
      id: accessProfileId(portalSlug, email),
      organizationId: orgId,
      title: `Amanda client access: ${email}`,
      payload: { ...fresh.data, entitlements, updatedAt: now.toISOString() },
    });
    if (!saved.ok || (process.env.VERCEL_ENV === 'production' && !saved.persistedToAirtable)) {
      errors.push(`Could not durably update an expired entitlement for ${email}`);
    }
  }
  return { scanned, expired, errors, ok: errors.length === 0 };
}
