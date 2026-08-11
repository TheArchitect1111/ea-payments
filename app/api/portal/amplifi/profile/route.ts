import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';

export const dynamic = 'force-dynamic';

export type AmplifiBrandProfile = {
  businessName: string;
  website: string;
  audience: string;
  brandVoice: string;
  primaryObjective: string;
  channels: string[];
  timezone: string;
  onboardingComplete: boolean;
  updatedAt: string;
};

function profileId(portalSlug: string): string {
  return `amplifi-profile-${portalSlug}`;
}

function clean(value: unknown, max = 600): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const profile = await loadStudioRecord<AmplifiBrandProfile>('brand', profileId(tenant.portalSlug));
  return NextResponse.json({ ok: true, profile });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const businessName = clean(body.businessName, 160);
  const website = clean(body.website, 320);
  const audience = clean(body.audience, 900);
  const brandVoice = clean(body.brandVoice, 900);
  const primaryObjective = clean(body.primaryObjective, 900);
  const timezone = clean(body.timezone, 80) || 'America/New_York';
  const channels = Array.isArray(body.channels)
    ? [...new Set(body.channels.map((item) => clean(item, 40)).filter(Boolean))].slice(0, 3)
    : [];

  if (!businessName || !audience || !brandVoice || !primaryObjective) {
    return NextResponse.json(
      { ok: false, error: 'Business name, audience, brand voice, and primary objective are required.' },
      { status: 400 },
    );
  }

  if (website && !/^https?:\/\//i.test(website)) {
    return NextResponse.json(
      { ok: false, error: 'Website must begin with http:// or https://.' },
      { status: 400 },
    );
  }

  const profile: AmplifiBrandProfile = {
    businessName,
    website,
    audience,
    brandVoice,
    primaryObjective,
    channels,
    timezone,
    onboardingComplete: true,
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveStudioRecord({
    recordType: 'brand',
    id: profileId(tenant.portalSlug),
    organizationId: tenant.organizationId,
    title: `Amplifi brand profile — ${businessName}`,
    payload: profile,
  });

  if (!saved.ok || (process.env.NODE_ENV === 'production' && !saved.persistedToAirtable)) {
    return NextResponse.json(
      { ok: false, error: 'Amplifi could not save the brand profile durably.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, profile });
}
