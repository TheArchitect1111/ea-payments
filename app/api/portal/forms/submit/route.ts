import { NextRequest, NextResponse } from 'next/server';
import { createPortalFormSubmission } from '@/lib/portal-forms/store';
import type { PortalFormKind } from '@/lib/portal-forms/types';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { notifyPortal } from '@/lib/portal-notify';
import { syntheticOrgId } from '@/lib/platform-store';
import { finalizeCtpAssetManifest, parseAssetUploads } from '@/lib/ctp-asset-store';
import { AMANDA_PORTAL_FORMS } from '@/lib/amanda-catherine/config';
import { checkRateLimit } from '@/lib/ai/rate-limit';

export const dynamic = 'force-dynamic';

function parseKind(raw: unknown): PortalFormKind | null {
  if (raw === 'intake' || raw === 'application') return raw;
  return null;
}

function clientKey(req: NextRequest, slug: string) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  return `portal-form:${slug}:${ip}`;
}

function validateAmandaApplication(payload: Record<string, unknown> | undefined) {
  if (!payload || typeof payload.formId !== 'string') return 'Choose an application form.';
  if (typeof payload.website === 'string' && payload.website.trim()) return 'Submission rejected.';
  const form = AMANDA_PORTAL_FORMS.find((item) => item.kind === 'application' && item.id === payload.formId);
  if (!form) return 'Choose a valid Amanda Catherine application form.';
  const allowedPayloadKeys = new Set(['formId', 'audience', 'answers', 'assetUploads', 'onboardingStatus', 'program', 'website']);
  if (Object.keys(payload).some((key) => !allowedPayloadKeys.has(key))) return 'Application payload contains unsupported fields.';
  if (payload.program !== undefined && !(form.id === 'partner-vendor-application' && payload.program === 'lifeline')) {
    return 'Application program is not valid for the selected form.';
  }
  if (!payload.answers || typeof payload.answers !== 'object' || Array.isArray(payload.answers)) return 'Complete the required application fields.';
  const answers = payload.answers as Record<string, unknown>;
  if (Object.keys(answers).some((key) => !form.fields.includes(key as never))) return 'Application contains unsupported answers.';
  for (const field of form.fields) {
    const value = answers[field];
    if (typeof value !== 'string' || !value.trim() || value.length > 2_000) return `Complete ${field.replaceAll('-', ' ')}.`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: {
    slug?: string;
    kind?: string;
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    payload?: Record<string, unknown>;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const slug = body.slug?.trim().toLowerCase();
  const kind = parseKind(body.kind);
  const name = body.name?.trim();
  const email = body.email?.trim();

  if (!slug || !kind || !name || !email) {
    return NextResponse.json(
      { error: 'slug, kind, name, and email are required.' },
      { status: 400 },
    );
  }

  if (name.length > 120 || email.length > 254 || (body.phone?.length || 0) > 40 || (body.notes?.length || 0) > 5_000) {
    return NextResponse.json({ error: 'Submission fields exceed the allowed length.' }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!checkRateLimit(clientKey(req, slug), 12, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
  }

  const payload = body.payload ? { ...body.payload } : undefined;
  if (slug === 'amanda-catherine' && kind === 'application') {
    const validationError = validateAmandaApplication(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  }
  const stagedUploads = parseAssetUploads(payload?.assetUploads);
  if (payload && stagedUploads) {
    payload.assetUploads = await finalizeCtpAssetManifest(
      stagedUploads,
      syntheticOrgId(slug),
    );
  }

  const submission = await createPortalFormSubmission({
    portalSlug: slug,
    kind,
    name,
    email,
    phone: body.phone,
    notes: body.notes,
    payload,
  });

  const pulseEvent = {
    product: 'ea-platform' as const,
    type: 'portal.form.submitted' as const,
    title: kind === 'application' ? 'Application submitted' : 'Intake submitted',
    detail: `${name} (${email})`,
    href: `/portal/${slug}/${kind === 'application' ? 'applications' : 'intake'}`,
    tenantId: syntheticOrgId(slug),
    objectId: submission.id,
    metadata: {
      kind,
      portalSlug: slug,
      status: submission.status,
      ...(typeof payload?.formId === 'string' ? { formId: payload.formId } : {}),
      ...(typeof payload?.audience === 'string' ? { audience: payload.audience } : {}),
      ...(typeof payload?.onboardingStatus === 'string'
        ? { onboardingStatus: payload.onboardingStatus }
        : {}),
      uploadedDocumentCount: stagedUploads ? Object.keys(stagedUploads).length : 0,
    },
  };

  await emitPulseEvent(pulseEvent);
  try {
    await notifyPortal(pulseEvent);
  } catch {
    // notification channel is best-effort
  }

  return NextResponse.json({ ok: true, submission });
}
