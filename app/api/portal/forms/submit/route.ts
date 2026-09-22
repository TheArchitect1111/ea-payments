import { NextRequest, NextResponse } from 'next/server';
import { createPortalFormSubmission } from '@/lib/portal-forms/store';
import type { PortalFormKind } from '@/lib/portal-forms/types';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { notifyPortal } from '@/lib/portal-notify';
import { syntheticOrgId } from '@/lib/platform-store';
import { finalizeCtpAssetManifest, parseAssetUploads } from '@/lib/ctp-asset-store';

export const dynamic = 'force-dynamic';

function parseKind(raw: unknown): PortalFormKind | null {
  if (raw === 'intake' || raw === 'application') return raw;
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

  const payload = body.payload ? { ...body.payload } : undefined;
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
