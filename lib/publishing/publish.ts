import { publishToAmplifi } from '@/lib/amplifi-publish';
import { createContentRequest, getClientByPortalSlug } from '@/lib/airtable';
import type { PublishCommunicationInput, PublishOutcome } from './types';

function sourceNotes(source?: PublishCommunicationInput['source']): string | undefined {
  if (!source) return undefined;
  return JSON.stringify(source);
}

export async function publishCommunication(
  input: PublishCommunicationInput,
): Promise<PublishOutcome> {
  const { channel, portalSlug: slug, title, body, actorName } = input;

  if (channel === 'amplifi') {
    const amplifi = await publishToAmplifi({
      slug,
      title,
      message: body,
      storyUrl: input.storyUrl,
      actorName,
    });
    return {
      ok: amplifi.ok,
      mode: amplifi.mode,
      detail: amplifi.detail,
      href: amplifi.shareUrls?.amplifi,
    };
  }

  if (channel === 'portal' || channel === 'content-request') {
    const client = await getClientByPortalSlug(slug);
    const requestType =
      input.requestType ?? (channel === 'portal' ? 'Portal Announcement' : 'Content Request');

    if (!client) {
      return {
        ok: true,
        mode: 'manual',
        detail:
          channel === 'portal'
            ? `Portal announcement ready — add to ${slug} updates manually.`
            : `${requestType} draft ready — configure Airtable client for ${slug} to auto-queue.`,
        href: channel === 'portal' ? `/portal/${slug}/updates` : undefined,
      };
    }

    const created = await createContentRequest({
      clientRecordId: client.id,
      organizationName: client.organization ?? client.clientName,
      requestType,
      pageLocation: channel === 'portal' ? 'Portal Home' : undefined,
      title,
      description: input.summary,
      content: body,
      additionalNotes: sourceNotes(input.source),
      submittedBy: actorName,
      status: input.contentRequestStatus ?? (channel === 'portal' ? 'Approved' : 'Pending Review'),
    });

    return created.ok
      ? {
          ok: true,
          mode: 'airtable',
          detail:
            channel === 'portal'
              ? 'Portal announcement queued in content requests.'
              : `${requestType} submitted to content requests.`,
          href: '/admin/content-requests',
        }
      : {
          ok: false,
          mode: 'airtable',
          detail: created.error ?? `Failed to queue ${requestType}.`,
        };
  }

  return {
    ok: true,
    mode: 'manual',
    detail: `${title} marked ready for ${channel} delivery.`,
    href: input.storyUrl,
  };
}

export type { PublishChannel, PublishMode, PublishOutcome } from './types';
