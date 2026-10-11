import { NextRequest, NextResponse } from 'next/server';
import { resolveCaptureTenant } from '@/lib/bricks/capture-entry-bridge';
import { progressCapture } from '@/lib/bricks/capture-family';
import { registerCommerce } from '@/lib/bricks/commerce-family';
import { fulfillCommerceStripePayment } from '@/lib/bricks/commerce-stripe';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { updatePortalFormSubmissionStatus } from '@/lib/portal-forms/store';
import type { PortalFormStatus } from '@/lib/portal-forms/types';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { publishPlatformActivityEvent } from '@/lib/activity-events-store';

export const dynamic = 'force-dynamic';

const ALLOWED: PortalFormStatus[] = ['submitted', 'reviewed', 'accepted', 'rejected'];

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!roleAtLeast(normalizeRole(auth.session.role), 'staff')) {
    return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  }

  let body: { submissionId?: string; status?: string; paymentReference?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const submissionId = body.submissionId?.trim();
  const status = body.status?.trim() as PortalFormStatus | undefined;
  if (!submissionId || !status || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'submissionId and valid status required.' }, { status: 400 });
  }

  const tenant = portalTenant(auth.session);
  const updated = await updatePortalFormSubmissionStatus({
    portalSlug: tenant.portalSlug,
    submissionId,
    status,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  }

  // Existing P/intake and P/applications queues remain the review UI.
  // A certified tenant additionally persists routed canonical lifecycle status.
  const kind = updated.kind === 'application' ? 'applications' : 'intake';
  const certified = await resolveCaptureTenant(tenant.portalSlug, kind);
  if (certified && (status === 'reviewed' || status === 'accepted')) {
    try {
      await progressCapture(certified, kind, updated.id, {
        confirm: async ({email,subject}) => {
          const mail = await sendAuthEmail({to:email,subject,
            title:'Application confirmation',
            bodyHtml:'<p>Your application has been received and is being reviewed.</p>'});
          if (!mail.ok) throw new Error('Application confirmation delivery failed');
        },
      });
      if (kind === 'applications' && status === 'accepted') {
        const offerId = updated.payload?.offerId;
        if (typeof offerId === 'string' && offerId) {
          // Approved applications with a configured offer enter the real Billing
          // adapter. Payment requires independent verified Stripe fulfillment.
          const order = await registerCommerce(certified,'billing',{
            email:updated.email,name:updated.name,offerId});
          if (body.paymentReference)
            await fulfillCommerceStripePayment(certified,'billing',order.id,body.paymentReference);
        }
      }
    } catch(error) {
      console.error('[portal-forms] certified workflow update failed',error);
      return NextResponse.json({error:'Durable review or payment handoff failed.'},{status:503});
    }
  }

  if (tenant.portalSlug === 'amanda-catherine') {
    await publishPlatformActivityEvent({ organizationId: 'amanda-catherine', module: 'applications', eventType: 'application_status_changed', title: `Amanda application ${status}`, summary: 'Application status updated', priority: status === 'accepted' ? 80 : 50, actionLabel: 'Open Amanda applications', actionUrl: '/portal/amanda-catherine/owner', metadata: { submissionId, status } });
  }

  return NextResponse.json({ ok: true, submission: updated });
}
