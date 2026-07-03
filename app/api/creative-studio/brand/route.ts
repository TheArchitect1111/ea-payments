import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { getBrandProfile, saveBrandProfile } from '@/lib/creative-studio/brand-store';
import type { BrandProfile } from '@/lib/creative-studio/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const orgId = req.nextUrl.searchParams.get('organizationId') ?? undefined;
  const brand = await getBrandProfile(orgId);
  return NextResponse.json({ ok: true, brand });
}

export async function PUT(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  let body: Partial<BrandProfile>;
  try {
    body = (await req.json()) as Partial<BrandProfile>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const existing = await getBrandProfile(body.organizationId);
  const brand = await saveBrandProfile({
    ...existing,
    ...body,
    organizationId: body.organizationId ?? existing.organizationId,
    organizationName: String(body.organizationName ?? existing.organizationName).trim() || existing.organizationName,
    primaryColor: String(body.primaryColor ?? existing.primaryColor).trim() || existing.primaryColor,
    secondaryColor: String(body.secondaryColor ?? existing.secondaryColor).trim() || existing.secondaryColor,
    voice: String(body.voice ?? existing.voice).trim() || existing.voice,
    preferredCta: String(body.preferredCta ?? existing.preferredCta).trim() || existing.preferredCta,
    preferredHeadlines: Array.isArray(body.preferredHeadlines)
      ? body.preferredHeadlines.map((h) => String(h).trim()).filter(Boolean)
      : existing.preferredHeadlines,
  });

  return NextResponse.json({ ok: true, brand });
}
