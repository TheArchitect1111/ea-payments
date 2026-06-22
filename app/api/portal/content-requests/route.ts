import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { createContentRequest, getClientByPortalSlug } from '@/lib/airtable';
import { enhanceContentRequest } from '@/lib/ai';
import { sendContentRequestConfirmation, sendInternalNotification } from '@/lib/email';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

async function authenticatedClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return null;
  return getClientByPortalSlug(session.slug);
}

export async function POST(req: NextRequest) {
  const client = await authenticatedClient();
  if (!client) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }

  const body = (await req.json()) as {
    requestType?: string;
    pageLocation?: string;
    title?: string;
    description?: string;
    content?: string;
    imageUrl?: string;
    videoLink?: string;
    documentUrl?: string;
    priority?: string;
    requestedPublishDate?: string;
    additionalNotes?: string;
    selectedContent?: string;
  };

  const requestType = (body.requestType ?? '').trim();
  const title = (body.title ?? '').trim();
  if (!requestType || !title) {
    return NextResponse.json({ error: 'Request type and title are required.' }, { status: 400 });
  }

  const contentSource = (body.selectedContent || body.content || body.description || title).trim();
  const aiAnalysis = await enhanceContentRequest(contentSource);

  const result = await createContentRequest({
    clientRecordId: client.id,
    organizationName: client.organization || client.clientName,
    requestType,
    pageLocation: body.pageLocation?.trim(),
    title,
    description: body.description?.trim(),
    content: (body.selectedContent || body.content)?.trim(),
    imageUrl: body.imageUrl?.trim(),
    videoLink: body.videoLink?.trim(),
    documentUrl: body.documentUrl?.trim(),
    priority: body.priority?.trim() || 'Normal',
    requestedPublishDate: body.requestedPublishDate?.trim(),
    additionalNotes: body.additionalNotes?.trim(),
    aiAnalysis,
    submittedBy: client.clientName,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Request could not be saved.' }, { status: 500 });
  }

  await emitPulseEvent({
    product: 'update-hub',
    type: 'update.submitted',
    title: `Update submitted: ${title}`,
    detail: `${client.clientName} — ${requestType}`,
    priority: body.priority === 'Urgent' ? 'high' : 'medium',
    href: `/admin/content-requests`,
    tenantId: client.portalSlug,
    objectId: result.recordId,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL;
  const portalUrl = `${baseUrl}/portal/${client.portalSlug}/updates`;

  try {
    await sendContentRequestConfirmation({
      email: client.email,
      clientName: client.clientName,
      requestId: result.requestId ?? result.recordId ?? 'Pending',
      requestType,
      title,
      portalUrl,
    });
  } catch (err) {
    console.error('sendContentRequestConfirmation failed:', err);
  }

  try {
    await sendInternalNotification({
      subject: `New content request from ${client.clientName}`,
      title: 'New Content Request',
      body: `New content request from ${client.clientName}: ${requestType} - ${title}`,
    });
  } catch (err) {
    console.error('sendInternalNotification failed:', err);
  }

  const webhookUrl = process.env.CONTENT_REQUEST_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: result.requestId,
          clientName: client.clientName,
          organizationName: client.organization || client.clientName,
          requestType,
          title,
          status: 'Pending Review',
        }),
      });
    } catch (err) {
      console.error('CONTENT_REQUEST_WEBHOOK_URL failed:', err);
    }
  }

  return NextResponse.json({
    ok: true,
    recordId: result.recordId,
    requestId: result.requestId,
    aiAnalysis,
  });
}
