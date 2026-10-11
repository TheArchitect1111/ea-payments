import { PLATFORM_ROLES } from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { findMembership } from '@/lib/memberships';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { loadAmandaInstall, signupAmandaBrick, readAmandaRegistration, AMANDA_BRICK_MODULES } from '@/lib/portal-universal/bricks/amanda';
import { listEntitlementsForOrg, activeModuleIdsFromEntitlements } from '@/lib/entitlements';
import { getStripe } from '@/lib/stripe';
import { fulfillPortableAmandaPayment } from '@/lib/portal-universal/bricks/amanda/stripe';

export const dynamic = 'force-dynamic';
const Input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('signup'), offerId: z.string(), name: z.string() }).strict(),
  z.object({ action: z.literal('checkout'), registrationId: z.string() }).strict(),
  z.object({ action: z.literal('payment'), registrationId: z.string(), reference: z.string().regex(/^pi_[a-zA-Z0-9]+$/) }).strict(),
]);
export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const auth = await guardPortalApi(req, { slug });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Origin denied' }, { status: 403 });
  try {
    const org = await findOrganizationByPortalSlug(slug);
    const email = auth.session.email?.trim().toLowerCase();
    if (!org || org.status !== 'Active' || !email || auth.session.orgId !== org.id)
      return NextResponse.json({ error: 'Tenant access denied' }, { status: 403 });
    const member = await findMembership(email, org.id);
    if (!member || member.status !== 'active' ||
        !(PLATFORM_ROLES as readonly string[]).includes(String(member.role)) ||
        !(PLATFORM_ROLES as readonly string[]).includes(String(auth.session.role))) return NextResponse.json({ error: 'Active membership required' }, { status: 403 });
    const install = await loadTenantInstall(org.id);
    const enabled = activeModuleIdsFromEntitlements(await listEntitlementsForOrg(org.id));
    if (install?.state !== 'installed' || !install.brickIds.includes('amanda') || AMANDA_BRICK_MODULES.some(id => !enabled.has(id)))
      return NextResponse.json({ error: 'Enrollment service unavailable' }, { status: 404 });
    const tenant = { organizationId: org.id, portalSlug: slug };
    const input = Input.parse(await req.json());
    if (input.action === 'signup') return NextResponse.json({ ok: true,
      registration: await signupAmandaBrick(tenant, { email, name: input.name, offerId: input.offerId }) });
    const row = await readAmandaRegistration(tenant, input.registrationId);
    if (row.email !== email) return NextResponse.json({ error: 'Registration access denied' }, { status: 403 });
    if (input.action === 'checkout') {
      if (row.payment_status === 'paid') return NextResponse.json({ error: 'Registration already paid' }, { status: 409 });
      const config = await loadAmandaInstall(tenant);
      const offer = config.offers.find(x => x.id === row.offerId)!;
      const session = await getStripe().checkout.sessions.create({ mode: 'payment', customer_email: email,
        line_items: [{ price_data: { currency: offer.currency, unit_amount: offer.amount, product_data: { name: offer.title } }, quantity: 1 }],
        metadata: { portableBrick: 'amanda', organizationId: org.id, portalSlug: slug, registrationId: row.registration_id },
        payment_intent_data: { metadata: { organizationId: org.id, registrationId: row.registration_id, offerId: row.offerId } },
        success_url: `${req.nextUrl.origin}/portal/${slug}/member`, cancel_url: `${req.nextUrl.origin}/portal/${slug}/member`,
      }, { idempotencyKey: 'enrollment-checkout-' + row.registration_id });
      return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
    }
    const registration = await fulfillPortableAmandaPayment(tenant, input.registrationId, input.reference);
    return NextResponse.json({ ok: true, registration });
  } catch (error) {
    console.error('[portable-enrollment]', error instanceof Error ? error.message : 'Request failed');
    return NextResponse.json({ error: 'Enrollment request could not be completed' }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}
