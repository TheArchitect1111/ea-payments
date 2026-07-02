import {
  getConnectOrg,
  listConnectOrgs,
  listConnectRelationshipsForSequence,
  markSequenceStepSent,
  type ConnectRelationship,
} from '@/lib/connect-store';
import { sendConnectSequenceEmail, sendConnectSms } from '@/lib/email';
import { logConnectChannelDelivery } from '@/lib/connect-delivery-log';
import { emitPulseEvent } from '@/lib/pulse-bus';

function platformBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.efficiencyarchitects.online';
  return raw.replace(/\/$/, '');
}

function buildTrackedResourceUrl(
  baseUrl: string,
  relationship: ConnectRelationship,
  resourceId: string,
  resourceUrl: string,
  campaignId?: string,
) {
  const absolute =
    resourceUrl.startsWith('http') ? resourceUrl : `${baseUrl}${resourceUrl.startsWith('/') ? '' : '/'}${resourceUrl}`;
  const track = new URL('/api/connect/track', baseUrl);
  track.searchParams.set('org', relationship.orgSlug);
  track.searchParams.set('relationship', relationship.id);
  track.searchParams.set('resource', resourceId);
  track.searchParams.set('type', 'link_click');
  track.searchParams.set('to', absolute);
  if (campaignId) track.searchParams.set('campaign', campaignId);
  return track.toString();
}

export async function processDueConnectSequences(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const baseUrl = platformBaseUrl();
  const relationships = await listConnectRelationshipsForSequence();
  const orgs = await listConnectOrgs();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const relationship of relationships) {
    const org = orgs.find((item) => item.slug === relationship.orgSlug);
    if (!org) {
      skipped += 1;
      continue;
    }

    const createdAt = new Date(relationship.createdAt).getTime();
    const journeyUrl = `${baseUrl}/connect/${org.slug}/journey`;

    for (const step of org.sequence) {
      if (step.delayDays === 0) continue;
      if (relationship.sequenceSent.includes(step.id)) continue;

      const dueAt = createdAt + step.delayDays * 86_400_000;
      if (Date.now() < dueAt) continue;

      const resource = org.resources.find((item) => item.id === step.resourceId);
      const resourceTitle = resource?.title ?? org.offer.resourceTitle;
      const resourceUrl = resource
        ? buildTrackedResourceUrl(baseUrl, relationship, resource.id, resource.url, relationship.campaignId)
        : journeyUrl;

      try {
        if (step.channel === 'email' || step.channel === 'both') {
          const emailResult = await sendConnectSequenceEmail({
            email: relationship.email,
            name: relationship.name,
            organizationName: org.name,
            stepTitle: step.title,
            resourceTitle,
            resourceUrl,
            journeyUrl,
          });
          await logConnectChannelDelivery({
            channel: 'email',
            provider: 'resend',
            trigger: 'nurture',
            orgSlug: org.slug,
            relationshipId: relationship.id,
            stepId: step.id,
            recipient: relationship.email,
            subject: step.title,
            result: emailResult,
          });
          if (!emailResult.ok) {
            errors.push(`${relationship.id}/${step.id}: ${emailResult.error ?? 'email failed'}`);
            continue;
          }
        }

        if ((step.channel === 'sms' || step.channel === 'both') && relationship.phone) {
          const smsResult = await sendConnectSms({
            phone: relationship.phone,
            organizationName: org.name,
            resourceTitle,
            journeyUrl: resourceUrl,
          });
          await logConnectChannelDelivery({
            channel: 'sms',
            provider: 'twilio',
            trigger: 'nurture',
            orgSlug: org.slug,
            relationshipId: relationship.id,
            stepId: step.id,
            recipient: relationship.phone,
            result: smsResult,
          });
          if (!smsResult.ok && step.channel === 'sms') {
            errors.push(`${relationship.id}/${step.id}: ${smsResult.error ?? 'sms failed'}`);
            continue;
          }
        } else if (step.channel === 'sms' || step.channel === 'both') {
          await logConnectChannelDelivery({
            channel: 'sms',
            provider: 'twilio',
            trigger: 'nurture',
            orgSlug: org.slug,
            relationshipId: relationship.id,
            stepId: step.id,
            result: { ok: false, error: 'No phone number provided.' },
            skipped: true,
          });
        }

        await markSequenceStepSent(relationship.id, step.id);
        relationship.sequenceSent.push(step.id);
        sent += 1;

        await emitPulseEvent({
          product: 'simplifi',
          type: 'capture.completed',
          title: `Connect sequence: ${step.title}`,
          detail: `${relationship.name} · ${org.name}`,
          href: resourceUrl,
          objectId: relationship.simplifiCaptureId ?? relationship.id,
          tenantId: org.slug,
          priority: 'low',
          metadata: { sequenceStepId: step.id, delayDays: step.delayDays },
        });
      } catch (error) {
        errors.push(
          `${relationship.id}/${step.id}: ${error instanceof Error ? error.message : 'sequence step failed'}`,
        );
      }
    }
  }

  return { processed: relationships.length, sent, skipped, errors };
}

export async function previewDueConnectSequences(): Promise<{
  relationships: number;
  dueSteps: number;
  dueByOrg: Record<string, number>;
}> {
  const relationships = await listConnectRelationshipsForSequence();
  const orgs = await listConnectOrgs();
  let dueSteps = 0;
  const dueByOrg: Record<string, number> = {};

  for (const relationship of relationships) {
    const org = orgs.find((item) => item.slug === relationship.orgSlug);
    if (!org) continue;

    const createdAt = new Date(relationship.createdAt).getTime();
    for (const step of org.sequence) {
      if (step.delayDays === 0) continue;
      if (relationship.sequenceSent.includes(step.id)) continue;
      const dueAt = createdAt + step.delayDays * 86_400_000;
      if (Date.now() >= dueAt) {
        dueSteps += 1;
        dueByOrg[org.slug] = (dueByOrg[org.slug] ?? 0) + 1;
      }
    }
  }

  return { relationships: relationships.length, dueSteps, dueByOrg };
}
