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
import { linkAmandaWorkflowPerson } from './workflow-person';

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
  updatedAt: z.string().min(1),
  welcomeCourseIds: z.array(z.string()).optional(),
  welcomeSentAt: z.string().optional(),
});

type AmandaAccessProfile = z.infer<typeof AmandaAccessProfileSchema>;

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
  return profile.success ? profile.data.courseIds : [...(invitedAmandaLearner(email)?.courseIds || [])];
}

/** Paid or explicitly invited learners may open Amanda's training surface even
 * while tenant-wide module entitlements are still being synchronized. */
export async function hasAmandaLearningAccess(portalSlug: string, email: string) {
  if (!portalSlug.toLowerCase().startsWith(AMANDA_PORTAL_SLUG) || !email.trim()) return false;
  return (await getAmandaAssignedCourseIds(portalSlug, email)).length > 0;
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
  audience: AmandaPortalAudience;
}) {
  const loginUrl = `${canonicalPlatformOrigin()}/portal/login?next=%2Fportal%2F${AMANDA_PORTAL_SLUG}%2Flearning`;
  const firstName = input.name.split(/\s+/)[0] || 'there';
  const safeFirstName = escapeHtml(firstName);
  const safeEmail = escapeHtml(input.email);
  const credentialHtml = `<div style="padding:18px;background:#f7f1e8;border-left:4px solid #b9894d;margin:20px 0;">
    <p><strong>Email:</strong> ${safeEmail}</p>
    <p>Sign in with this email and use the secure code sent to your inbox.</p>
  </div>`;
  const text = `Your Amanda Catherine course access is ready. Sign in at ${loginUrl} with ${input.email} and use the secure code sent to your email.`;

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
}) {
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

  // Amanda uses email-code authentication. Bind new records without creating
  // or storing a plaintext password; preserve any other portal identity.
  if (!belongsToAnotherPortal && !record.portalSlug) {
    const credentials = await setPortalCredentials(record.id, AMANDA_PORTAL_SLUG, '', email);
    if (!credentials.ok) return { ok: false as const, error: credentials.error || 'Portal access could not be assigned.' };
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
  const courseIds = [...new Set([...priorCourseIds, ...(input.courseIds || [])])];
  const accessChanged = !existingProfile || courseIds.some((courseId) => !priorCourseIds.includes(courseId));
  const profile: AmandaAccessProfile = {
    portalSlug: AMANDA_PORTAL_SLUG, email, name,
    audience: existingProfile?.audience === 'admin' || existingProfile?.audience === 'staff' ? existingProfile.audience : input.audience,
    courseIds, welcomeCourseIds: existingProfile?.welcomeCourseIds || [], welcomeSentAt: existingProfile?.welcomeSentAt,
    updatedAt: new Date().toISOString(),
  };
  const profileSave = await saveStudioRecord({
    recordType: 'experience',
    id: accessProfileId(AMANDA_PORTAL_SLUG, email),
    organizationId: syntheticOrgId(AMANDA_PORTAL_SLUG),
    title: `Amanda client access: ${email}`,
    payload: profile,
  });
  if (!profileSave.ok) {
    return { ok: false as const, error: profileSave.error || 'Course assignment could not be saved.' };
  }

  if ((process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'preview') && !profileSave.persistedToAirtable) return { ok: false as const, error: 'Durable course assignment storage is unavailable.' };

  let personId: string | null;
  try {
    personId = await linkAmandaWorkflowPerson({ email, name, clientRecordId: record.id,
      reference: input.transactionId || accessProfileId(AMANDA_PORTAL_SLUG, email),
      label: `Amanda course access: ${courseIds.join(', ')}`, student: courseIds.length > 0 });
  } catch {
    return { ok: false as const, error: 'Course access was assigned, but the People connection needs attention.', accessCreated: true };
  }

  let welcomeSent = false;
  if (!profile.welcomeSentAt || courseIds.some((courseId) => !profile.welcomeCourseIds?.includes(courseId))) {
    const welcome = await sendAmandaWelcome({
      email,
      name,
      audience: input.audience,
    });
    welcomeSent = welcome.ok;
    if (!welcome.ok) {
      return { ok: false as const, error: welcome.error || 'Access was created, but the welcome email could not be sent.', accessCreated: true };
    }
    const welcomeSave = await saveStudioRecord({
      recordType: 'experience', id: accessProfileId(AMANDA_PORTAL_SLUG, email),
      organizationId: syntheticOrgId(AMANDA_PORTAL_SLUG), title: `Amanda client access: ${email}`,
      payload: { ...profile, welcomeCourseIds: courseIds, welcomeSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
    if (!welcomeSave.ok || ((process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'preview') && !welcomeSave.persistedToAirtable)) return { ok: false as const, error: 'Access was created, but welcome delivery could not be recorded.', accessCreated: true };
  }

  return {
    ok: true as const,
    created: created || accessChanged,
    welcomeSent,
    personId,
    clientRecordId: record.id,
    email,
    loginUrl: `${canonicalPlatformOrigin()}/portal/login?next=%2Fportal%2F${AMANDA_PORTAL_SLUG}%2Flearning`,
  };
}
