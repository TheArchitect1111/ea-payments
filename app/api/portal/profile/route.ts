import { NextRequest, NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { getClientSuccessProfile } from '@/lib/client-success';

export const dynamic = 'force-dynamic';

/** Portal profile for mobile settings and account screens. */
export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const session = auth.session;
  if (!session.email) {
    return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 });
  }

  const client = await getClientByPortalSlug(session.slug);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client not found.' }, { status: 404 });
  }

  const profile = await getClientSuccessProfile(client);

  return NextResponse.json({
    ok: true,
    session: {
      slug: session.slug,
      email: session.email,
      role: session.role,
      orgId: session.orgId,
    },
    client: {
      id: client.id,
      clientName: client.clientName,
      organization: client.organization ?? client.clientName,
      email: client.email,
      packagePurchased: client.packagePurchased,
      portalAccessStatus: client.portalAccessStatus,
      onboardingStatus: client.onboardingStatus,
      paymentDate: client.paymentDate,
    },
    success: profile,
  });
}
