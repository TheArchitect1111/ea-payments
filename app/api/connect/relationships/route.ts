import { NextRequest, NextResponse } from 'next/server';
import {
  createConnectRelationship,
  getConnectOrg,
  listConnectRelationships,
  recordConnectEngagement,
  updateConnectRelationshipHandoff,
  markSequenceStepSent,
  type CreateRelationshipInput,
} from '@/lib/connect-store';
import { handoffConnectRelationship } from '@/lib/connect-pipeline';
import { logConnectChannelDelivery } from '@/lib/connect-delivery-log';
import { sendConnectSms, sendConnectWelcomeEmail, sendInternalNotification } from '@/lib/email';
import {
  adminAuthJsonError,
  requireAdminSessionFromRequest,
} from '@/lib/admin-session-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Admin-only list — public GET leaked relationship PII. POST remains public for Connect capture. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminSessionFromRequest(request);
  if (!auth.ok) return adminAuthJsonError(auth);

  const org = request.nextUrl.searchParams.get('org') ?? undefined;
  const relationships = await listConnectRelationships(org);
  return NextResponse.json({ relationships });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orgSlug = clean(body.orgSlug) ?? 'demo';
    const name = clean(body.name);
    const email = clean(body.email);

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const input: CreateRelationshipInput = {
      orgSlug,
      name,
      email,
      phone: clean(body.phone),
      organization: clean(body.organization),
      role: clean(body.role),
      source: body.source === 'NFC' || body.source === 'Direct' || body.source === 'Representative' ? body.source : 'QR',
      event: clean(body.event),
      representative: clean(body.representative),
      conversationNotes: clean(body.conversationNotes),
      leadType: clean(body.leadType),
      tags: Array.isArray(body.tags) ? body.tags.map(clean).filter(Boolean) as string[] : [],
      campaignId: clean(body.campaignId),
    };

    const relationship = await createConnectRelationship(input);
    const org = await getConnectOrg(orgSlug);

    const handoff = await handoffConnectRelationship(relationship, org);
    if (handoff.simplifi.captureId || handoff.amplifi.shareUrl) {
      await updateConnectRelationshipHandoff(relationship.id, {
        simplifiCaptureId: handoff.simplifi.captureId,
        amplifiShareUrl: handoff.amplifi.shareUrl,
      });
      relationship.simplifiCaptureId = handoff.simplifi.captureId;
      relationship.amplifiShareUrl = handoff.amplifi.shareUrl;
    }

    await recordConnectEngagement({
      orgSlug,
      relationshipId: relationship.id,
      campaignId: input.campaignId,
      type: 'contact_exchange',
    });
    const resources = org.sequence
      .filter((step) => step.delayDays === 0)
      .map((step) => org.resources.find((resource) => resource.id === step.resourceId))
      .filter(Boolean);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const guideResource = resources[0];
    const guideUrl = guideResource
      ? `${baseUrl}/api/connect/track?org=${encodeURIComponent(orgSlug)}&relationship=${encodeURIComponent(relationship.id)}&campaign=${encodeURIComponent(input.campaignId ?? '')}&resource=${encodeURIComponent(guideResource.id)}&type=link_click&to=${encodeURIComponent(guideResource.url)}`
      : `${baseUrl}/connect/${orgSlug}/journey`;
    const journeyUrl = `${baseUrl}/connect/${orgSlug}/journey`;
    const emailDelivery = await sendConnectWelcomeEmail({
      email: relationship.email,
      name: relationship.name,
      organizationName: org.name,
      resourceTitle: org.offer.resourceTitle,
      guideUrl,
      journeyUrl,
    });
    await logConnectChannelDelivery({
      channel: 'email',
      provider: 'resend',
      trigger: 'capture',
      orgSlug,
      relationshipId: relationship.id,
      recipient: relationship.email,
      subject: `Welcome to ${org.name}`,
      result: emailDelivery,
    });
    const welcomeStep = org.sequence.find((step) => step.delayDays === 0);
    if (emailDelivery.ok && welcomeStep) {
      await markSequenceStepSent(relationship.id, welcomeStep.id);
    }
    const smsDelivery = relationship.phone
      ? await sendConnectSms({
          phone: relationship.phone,
          organizationName: org.name,
          resourceTitle: org.offer.resourceTitle,
          journeyUrl,
        })
      : { ok: false, error: 'No phone number provided.' };
    await logConnectChannelDelivery({
      channel: 'sms',
      provider: 'twilio',
      trigger: 'capture',
      orgSlug,
      relationshipId: relationship.id,
      recipient: relationship.phone,
      result: smsDelivery,
      skipped: !relationship.phone,
    });
    const staffNotice = await sendInternalNotification({
      subject: `New ${org.name} Connect - ${relationship.name}`,
      title: 'New Connect Relationship',
      body: [
        `Name: ${relationship.name}`,
        `Email: ${relationship.email}`,
        `Phone: ${relationship.phone ?? 'Not provided'}`,
        `Event: ${relationship.event ?? 'Not provided'}`,
        `Representative: ${relationship.representative ?? 'Unassigned'}`,
        `Lead Type: ${relationship.leadType}`,
        `Routed Team: ${relationship.routedTeam}`,
        `Opportunity Score: ${relationship.aiProfile.opportunityScore}`,
        `Recommended Action: ${relationship.aiProfile.recommendedAction}`,
        '',
        relationship.conversationNotes ?? 'No notes captured.',
      ].join('\n'),
    });
    await logConnectChannelDelivery({
      channel: 'staff',
      provider: 'resend-internal',
      trigger: 'staff',
      orgSlug,
      relationshipId: relationship.id,
      subject: `New ${org.name} Connect - ${relationship.name}`,
      result: staffNotice,
    });
    const automationWebhook = process.env.CONNECT_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    const automationDelivery = automationWebhook
      ? await fetch(automationWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'connect.relationship.created',
            org,
            relationship,
            resources,
            guideUrl,
            journeyUrl,
          }),
        })
          .then(async (response) => ({ ok: response.ok, status: response.status, error: response.ok ? undefined : await response.text().catch(() => 'Webhook failed.') }))
          .catch((error) => ({ ok: false, error: error instanceof Error ? error.message : 'Webhook failed.' }))
      : { ok: false, error: 'Automation webhook not configured.' };
    await logConnectChannelDelivery({
      channel: 'webhook',
      provider: 'n8n',
      trigger: 'capture',
      orgSlug,
      relationshipId: relationship.id,
      result: automationDelivery,
      skipped: !automationWebhook,
    });

    return NextResponse.json({
      relationship,
      resources,
      redirectDestination: org.redirectDestination,
      nextSequence: org.sequence,
      handoff,
      delivery: {
        email: emailDelivery,
        sms: smsDelivery,
        staffNotice,
        automation: automationDelivery,
      },
      message: 'Relationship activated.',
    });
  } catch (error) {
    console.error('[connect] create relationship failed', error);
    return NextResponse.json({ error: 'Unable to activate relationship.' }, { status: 500 });
  }
}
