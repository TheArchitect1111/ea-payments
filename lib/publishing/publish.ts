import { publishToAmplifi } from '@/lib/amplifi-publish';
import { createContentRequest, getClientByPortalSlug } from '@/lib/airtable';
import type { PublishCommunicationInput, PublishOutcome } from './types';

function sourceNotes(source?: PublishCommunicationInput['source']): string | undefined {
  if (!source) return undefined;
  return JSON.stringify(source);
}

function attemptedNow(): string {
  return new Date().toISOString();
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
      idempotencyKey: input.idempotencyKey,
      media: input.media,
    });
    return {
      ok: amplifi.ok,
      mode: amplifi.mode,
      status: amplifi.status,
      detail: amplifi.detail,
      href: amplifi.shareUrls?.amplifi,
      externalId: amplifi.externalId,
      idempotencyKey: amplifi.idempotencyKey,
      attemptedAt: amplifi.attemptedAt,
      retryable: amplifi.retryable,
    };
  }

  if (channel === 'portal' || channel === 'content-request') {
    const attemptedAt = attemptedNow();
    const client = await getClientByPortalSlug(slug);
    const requestType =
      input.requestType ?? (channel === 'portal' ? 'Portal Announcement' : 'Content Request');

    if (!client) {
      return {
        ok: false,
        mode: 'manual',
        status: 'blocked',
        detail:
          channel === 'portal'
            ? `Portal announcement blocked — no configured client record for ${slug}.`
            : `${requestType} blocked — configure the Airtable client for ${slug}.`,
        href: channel === 'portal' ? `/portal/${slug}/updates` : undefined,
        attemptedAt,
        retryable: false,
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
          status: 'queued',
          detail:
            channel === 'portal'
              ? 'Portal announcement queued in content requests.'
              : `${requestType} submitted to content requests.`,
          href: '/admin/content-requests',
          attemptedAt,
          retryable: false,
        }
      : {
          ok: false,
          mode: 'airtable',
          status: 'failed',
          detail: created.error ?? `Failed to queue ${requestType}.`,
          attemptedAt,
          retryable: true,
        };
  }

  return {
    ok: false,
    mode: 'manual',
    status: 'blocked',
    detail: `${title} is ready, but no automated ${channel} publishing provider is connected.`,
    href: input.storyUrl,
    attemptedAt: attemptedNow(),
    retryable: false,
  };
}

export type {
  PublishChannel,
  PublishMode,
  PublishOutcome,
  PublishStatus,
} from './types';
