import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { createContentRequest, getClientByPortalSlug } from '@/lib/airtable';
import { sendContentRequestConfirmation, sendInternalNotification } from '@/lib/email';
import { notifyPortal } from '@/lib/portal-notify';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

const SOCIAL_POST_TYPE = 'Social Post';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const session = auth.session;

  const client = await getClientByPortalSlug(session.slug);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client not found.' }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    caption?: string;
    linkedIn?: string;
    storyUrl?: string;
    captureId?: string;
  };

  const title = (body.title ?? '').trim();
  const storyUrl = (body.storyUrl ?? '').trim();
  const caption = (body.linkedIn ?? body.caption ?? '').trim();

  if (!title || !caption) {
    return NextResponse.json({ ok: false, error: 'Title and post caption are required.' }, { status: 400 });
  }

  const additionalNotes = JSON.stringify({
    source: 'amplifi',
    storyUrl: storyUrl || undefined,
    captureId: body.captureId?.trim() || undefined,
    submittedAt: new Date().toISOString(),
  });

  const result = await createContentRequest({
    clientRecordId: client.id,
    organizationName: client.organization || client.clientName,
    requestType: SOCIAL_POST_TYPE,
    title,
    description: caption.slice(0, 500),
    content: caption,
    videoLink: storyUrl || undefined,
    priority: 'Normal',
    status: 'Awaiting Approval',
    additionalNotes,
    submittedBy: client.clientName,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? 'Could not save post.' }, { status: 500 });
  }

  await notifyPortal({
    product: 'amplifi',
    type: 'update.submitted',
    title: `Social post submitted: ${title}`,
    detail: `${client.clientName} — awaiting approval`,
    priority: 'medium',
    href: '/admin/content-requests',
    tenantId: client.portalSlug,
    objectId: result.recordId,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL;
  const updatesUrl = `${baseUrl}/portal/${client.portalSlug}/updates`;

  try {
    await sendContentRequestConfirmation({
      email: client.email,
      clientName: client.clientName,
      requestId: result.requestId ?? result.recordId ?? 'Pending',
      requestType: SOCIAL_POST_TYPE,
      title,
      portalUrl: updatesUrl,
    });
  } catch {
    /* non-blocking */
  }

  try {
    await sendInternalNotification({
      subject: `Amplifi post awaiting approval — ${client.clientName}`,
      title: 'Amplifi Social Post',
      body: `${client.clientName} submitted a social post for approval: ${title}`,
    });
  } catch {
    /* non-blocking */
  }

  return NextResponse.json({
    ok: true,
    requestId: result.requestId,
    recordId: result.recordId,
    updatesUrl,
    status: 'Awaiting Approval',
  });
}
