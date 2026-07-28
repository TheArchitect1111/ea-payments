import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { findOrganizationByPortalSlug, updateOrganizationWorkspaceConfig } from '@/lib/organizations';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

function isValidBookingUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!roleAtLeast(normalizeRole(auth.session.role), 'staff')) {
    return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  }

  let body: { bookingUrl?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const bookingUrl = body.bookingUrl?.trim() || '';
  if (bookingUrl && !isValidBookingUrl(bookingUrl)) {
    return NextResponse.json({ error: 'Enter a valid http(s) booking URL.' }, { status: 400 });
  }

  const org =
    auth.session.orgId && !auth.session.orgId.startsWith('org_')
      ? { id: auth.session.orgId }
      : await findOrganizationByPortalSlug(auth.session.slug);

  if (!org?.id || org.id.startsWith('org_')) {
    return NextResponse.json({ error: 'Organization not found for this portal.' }, { status: 404 });
  }

  const updated = await updateOrganizationWorkspaceConfig(org.id, { bookingUrl });
  if (!updated) {
    return NextResponse.json({ error: 'Could not save booking URL.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, bookingUrl: updated.bookingUrl || '' });
}
