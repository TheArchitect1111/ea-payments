import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { getAllContentRequests, getClientByRecordId, updateContentRequest } from '@/lib/airtable';
import { isSocialPostRequest, parseSocialPostNotes, publishToAmplifi } from '@/lib/amplifi-publish';
import { sendUpdatePublishedEmail } from '@/lib/email';
import { emitPulseEvent } from '@/lib/pulse-bus';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    status?: string;
    markPublished?: boolean;
    markScheduled?: boolean;
    publishedBody?: string;
  };

  const status = body.markPublished ? 'Published' : body.markScheduled ? 'Scheduled' : body.status;
  const datePublished = body.markPublished ? new Date().toISOString().slice(0, 10) : undefined;
  const publishedBody = body.publishedBody?.trim();

  const result = await updateContentRequest(id, {
    status,
    datePublished,
    publishedContent: publishedBody,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Update failed.' }, { status: 500 });
  }

  let amplifi: Awaited<ReturnType<typeof publishToAmplifi>> | undefined;

  if (body.markPublished) {
    const list = await getAllContentRequests();
    const record = list.find((r) => r.id === id);

    if (record?.clientRecordId) {
      const client = await getClientByRecordId(record.clientRecordId);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.efficiencyarchitects.online';

      if (client?.email && client.portalSlug) {
        await sendUpdatePublishedEmail({
          email: client.email,
          clientName: client.clientName,
          title: record.title,
          portalUrl: `${baseUrl}/portal/${client.portalSlug}/updates`,
        }).catch(() => {});
      }

      if (isSocialPostRequest(record.requestType) && client?.portalSlug) {
        const meta = parseSocialPostNotes(record.additionalNotes);
        amplifi = await publishToAmplifi({
          slug: client.portalSlug,
          title: record.title,
          message: publishedBody ?? record.content ?? record.description ?? record.title,
          caption: publishedBody ?? record.content,
          storyUrl: record.videoLink ?? meta.storyUrl,
          actorName: 'EA Admin',
        });

        await emitPulseEvent({
          product: 'amplifi',
          type: 'update.published',
          title: `Social published: ${record.title}`,
          detail: amplifi.detail,
          priority: 'medium',
          href: '/admin/content-requests',
          tenantId: client.portalSlug,
          objectId: id,
        }).catch(() => {});
      } else {
        await emitPulseEvent({
          product: 'update-hub',
          type: 'update.published',
          title: `Published: ${record.title}`,
          detail: record.organizationName,
          priority: 'medium',
          href: '/admin/content-requests',
          tenantId: client?.portalSlug,
          objectId: id,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true, status, datePublished, amplifi });
}
