import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { createContentRequest, getClientByPortalSlug } from '@/lib/airtable';
import { enhanceContentRequest } from '@/lib/ai';
import { sendContentRequestConfirmation, sendInternalNotification } from '@/lib/email';
import { notifyPortal } from '@/lib/portal-notify';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { fireContentRequestWebhook } from '@/lib/make-webhooks';
import {
  channelFromRequestType,
  normalizeUpdateHubChannel,
  type UpdateHubChannel,
} from '@/lib/update-hub-channels';
import { notifyUpdateHubAudience } from '@/lib/update-hub-notify';

export const dynamic = 'force-dynamic';

function channelFromNotes(notes?: string, requestType?: string): UpdateHubChannel {
  const match = notes?.match(/Channel:\s*([^.\n]+)/i);
  if (match?.[1]) {
    const label = match[1].trim().toLowerCase();
    const byLabel: Record<string, UpdateHubChannel> = {
      members: 'members',
      staff: 'staff',
      volunteers: 'volunteers',
      stakeholders: 'stakeholders',
      'organization-wide': 'organization',
      organization: 'organization',
    };
    const fromLabel = byLabel[label];
    if (fromLabel) return fromLabel;
    const normalized = normalizeUpdateHubChannel(label.replace(/\s+/g, ''));
    if (normalized) return normalized;
  }
  return channelFromRequestType(requestType ?? '');
}

async function authenticatedClient() {
  const auth = await guardPortalApiCookie();
  if (!auth.ok) return null;
  const tenant = portalTenant(auth.session);
  return getClientByPortalSlug(tenant.portalSlug);
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

  await notifyPortal({
    product: 'update-hub',
    type: 'update.submitted',
    title: `Update submitted: ${title}`,
    detail: `${client.clientName} — ${requestType}`,
    priority: body.priority === 'Urgent' ? 'high' : 'medium',
    href: `/portal/${client.portalSlug}/updates`,
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

  // Channel email — use client email so field testers receive the loop (not skip).
  try {
    const channel = channelFromNotes(body.additionalNotes, requestType);
    await notifyUpdateHubAudience({
      channel,
      organizationName: client.organization || client.clientName,
      title,
      summary: (body.description || body.content || '').trim() || `${requestType} request submitted.`,
      portalHref: portalUrl,
      recipientEmail: client.email,
    });
  } catch (err) {
    console.error('notifyUpdateHubAudience failed:', err);
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
    await fireContentRequestWebhook({
      requestId: result.requestId,
      clientName: client.clientName,
      organizationName: client.organization || client.clientName,
      requestType,
      title,
      status: 'Pending Review',
    });
  }

  return NextResponse.json({
    ok: true,
    recordId: result.recordId,
    requestId: result.requestId,
    aiAnalysis,
  });
}
